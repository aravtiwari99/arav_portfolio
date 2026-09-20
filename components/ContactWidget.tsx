"use client";

import { useEffect, useRef, useState } from "react";
import { decryptMessageText, encryptMessageText, sanitizeFileAttachment, type ChatAttachment } from "@/lib/e2ee";
import GoldiBot from "@/components/GoldiBot";

type Mode = "home" | "chooser" | "chat" | "call";
type Status = "sent" | "delivered" | "seen";
type Message = {
  id: string;
  sender: "visitor" | "admin";
  body: string;
  createdAt: string;
  editedAt?: string;
  deleted?: boolean;
  status?: Status;
  replyToId?: string | null;
  attachment?: ChatAttachment | null;
  reactions?: string[];
};

const VISITOR_KEY = "arav_contact_visitor";
const CONVERSATION_KEY = "arav_contact_conversation";
const MESSAGE_CACHE_PREFIX = "arav_contact_messages_";
const SETTINGS_KEY = "arav_contact_settings";
const REGISTRATION_KEY = "arav_contact_registration";
const ARAV_WARNING_KEY = "arav_contact_warning_seen";

function getStored(key: string) {
  if (typeof window === "undefined") return "";
  let value = localStorage.getItem(key);
  if (!value) {
    value = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${key}=`))
      ?.split("=")[1] || "";
  }
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(key, value);
  }
  document.cookie = `${key}=${encodeURIComponent(value)}; Max-Age=31536000; Path=/; SameSite=Lax`;
  localStorage.setItem(key, value);
  return value;
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusTicks({ status = "sent", hideBlueTicks = false }: { status?: Status; hideBlueTicks?: boolean }) {
  const color = status === "seen" && !hideBlueTicks ? "text-cyan-400" : "text-matrix-green/50";
  return <span className={`ml-1 text-[13px] leading-none ${color}`}>✓✓</span>;
}

export default function ContactWidget() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [notice, setNotice] = useState("");
  const [nameError, setNameError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [draftAttachment, setDraftAttachment] = useState<ChatAttachment | null>(null);
  const [voiceNoteBlob, setVoiceNoteBlob] = useState<{ name: string; data: string; mime: string; size: number } | null>(null);
  const [activeMessageId, setActiveMessageId] = useState("");
  const [profileLightbox, setProfileLightbox] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [disappearingTimer, setDisappearingTimer] = useState("off");
  const [hideBlueTicks, setHideBlueTicks] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [aravWarning, setAravWarning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastAdminCount = useRef(0);
  const pressTimer = useRef<number | null>(null);
  const recordingStartedAt = useRef(0);
  const recordingTimer = useRef<number | null>(null);
  const releaseRequested = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONVERSATION_KEY);
    const registration = localStorage.getItem(REGISTRATION_KEY);
    if (registration) {
      try {
        const savedIdentity = JSON.parse(registration) as { name?: string; phone?: string };
        if (savedIdentity.name && savedIdentity.phone) {
          setName(savedIdentity.name);
          setPhone(savedIdentity.phone);
          setRegistrationComplete(true);
        }
      } catch {
        localStorage.removeItem(REGISTRATION_KEY);
      }
    }
    if (saved) {
      setConversationId(saved);
      setMode(registration ? "chooser" : "chat");
    }
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as { disappearingTimer?: string; hideBlueTicks?: boolean };
        setDisappearingTimer(parsed.disappearingTimer || "off");
        setHideBlueTicks(Boolean(parsed.hideBlueTicks));
      } catch {
        localStorage.removeItem(SETTINGS_KEY);
      }
    }
  }, []);

  function openAravConversation() {
    setOpen(true);
    setMode(conversationId ? "chat" : "home");
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
    if (!localStorage.getItem(ARAV_WARNING_KEY)) {
      localStorage.setItem(ARAV_WARNING_KEY, "true");
      setAravWarning(true);
      window.setTimeout(() => setAravWarning(false), 3000);
    }
  }

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const cached = localStorage.getItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`);
    if (cached) {
      try {
        setMessages(JSON.parse(cached) as Message[]);
      } catch {
        localStorage.removeItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`);
      }
    }

    const load = async () => {
      const response = await fetch(`/api/chat?conversationId=${encodeURIComponent(conversationId)}`, { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as { exists: boolean; messages: Message[] };
      if (!result.exists) {
        localStorage.removeItem(CONVERSATION_KEY);
        document.cookie = `${CONVERSATION_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
        setConversationId("");
        setMessages([]);
        setMode("home");
        return;
      }

      const decrypted = await Promise.all(
        result.messages.map(async (item) => ({
          ...item,
          body: await decryptMessageText(conversationId, item.body),
        })),
      );

      const adminCount = result.messages.filter((item) => item.sender === "admin").length;
      if (adminCount > lastAdminCount.current && lastAdminCount.current > 0) {
        setNotice("New reply from Arav");
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New reply from Arav", { body: decrypted[decrypted.length - 1]?.body || "New message" });
        }
      }
      lastAdminCount.current = adminCount;
      setMessages(decrypted);
      localStorage.setItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`, JSON.stringify(decrypted));
    };

    const loadPresence = async () => {
      const response = await fetch("/api/presence");
      if (!response.ok) return;
      const result = (await response.json()) as { lastSeen: string | null; visible: boolean };
      setLastSeen(result.lastSeen); setLastSeenVisible(result.visible);
    };

    void load();
    void loadPresence();
    const timer = window.setInterval(() => {
      void load();
      void loadPresence();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [conversationId]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ disappearingTimer, hideBlueTicks }));
  }, [disappearingTimer, hideBlueTicks]);

  useEffect(() => {
    const blockShortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && ["3", "4", "5"].includes(event.key)) event.preventDefault();
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") event.preventDefault();
    };
    const blockContextMenu = (event: MouseEvent) => event.preventDefault();
    window.addEventListener("keydown", blockShortcuts);
    window.addEventListener("contextmenu", blockContextMenu);
    return () => {
      window.removeEventListener("keydown", blockShortcuts);
      window.removeEventListener("contextmenu", blockContextMenu);
    };
  }, []);

  useEffect(() => {
    const openAravChat = () => {
      openAravConversation();
    };
    window.addEventListener("open-arav-chat", openAravChat);
    return () => window.removeEventListener("open-arav-chat", openAravChat);
  }, [conversationId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      } else if (contentRef.current) {
        contentRef.current.scrollTop = contentRef.current.scrollHeight;
      }
    });
  }, [messages, open]);

  async function startChat() {
    const submittedName = name.trim();
    const normalizedName = submittedName.toLowerCase().replace(/\s+/g, " ");
    const indianMobile = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
    if (!submittedName) {
      setNameError(false);
      return setNotice("Please enter your full name.");
    }
    if (normalizedName === "arav tiwari" || normalizedName === "tiwari" || normalizedName === "arav") {
      setNameError(true);
      return setNotice("Please enter your name, not admin.");
    }
    if (!phone.trim()) {
      setNameError(false);
      return setNotice("Please enter your mobile number.");
    }
    if (!indianMobile.test(phone.trim().replace(/[()\s-]/g, ""))) {
      setNameError(false);
      return setNotice("Please enter a valid Indian mobile number.");
    }
    setNameError(false);
    setBusy(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorKey: getStored(VISITOR_KEY),
        name,
        phone,
        message: "Hello, I would like to connect.",
      }),
    });
    const result = (await response.json()) as { conversationId?: string; error?: string };
    setBusy(false);
    if (!response.ok || !result.conversationId) return setNotice(result.error || "Could not start chat.");
    localStorage.setItem(CONVERSATION_KEY, result.conversationId);
    setConversationId(result.conversationId);
    localStorage.setItem(REGISTRATION_KEY, JSON.stringify({ name: name.trim(), phone: phone.trim() }));
    setRegistrationComplete(true);
    setMode("chooser");
    setNotice("");
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  }

  async function sendMessage() {
    if ((!message.trim() && !draftAttachment) || !conversationId) return;
    const outgoingBody = message.trim() || "Shared an attachment";
    const optimisticMessage: Message = {
      id: `local-${Date.now()}`,
      sender: "visitor",
      body: outgoingBody,
      createdAt: new Date().toISOString(),
      status: "sent",
      attachment: draftAttachment,
      replyToId,
    };
    setMessages((current) => [...current, optimisticMessage]);
    setBusy(true);
    const encryptedText = await encryptMessageText(conversationId, outgoingBody);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        visitorKey: getStored(VISITOR_KEY),
        name: name || "Visitor",
        phone,
        message: encryptedText,
        replyToId,
        attachment: draftAttachment,
        expiresInSeconds: disappearingTimer === "off" ? undefined : Number(disappearingTimer),
      }),
    });
    if (!response.ok) setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
    setMessage("");
    setDraftAttachment(null);
    setReplyToId(null);
    setBusy(false);
  }

  async function runConversationAction(action: "clear-me" | "clear-everyone" | "delete-chat") {
    if (!conversationId) return;
    const labels = {
      "clear-me": "Clear this chat for you?",
      "clear-everyone": "Clear this chat for everyone?",
      "delete-chat": "Delete this chat permanently?",
    };
    if (!window.confirm(labels[action])) return;
    const response = await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, conversationId, visitorKey: getStored(VISITOR_KEY) }),
    });
    if (!response.ok) {
      setNotice("This chat action could not be completed.");
      return;
    }
    localStorage.removeItem(`${MESSAGE_CACHE_PREFIX}${conversationId}`);
    if (action === "delete-chat") {
      localStorage.removeItem(CONVERSATION_KEY);
      document.cookie = `${CONVERSATION_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
      setConversationId("");
      setMessages([]);
      setMode("home");
      setSettingsOpen(false);
      return;
    }
    setMessages([]);
    setNotice(action === "clear-me" ? "Chat cleared for you." : "Chat cleared for everyone.");
  }

  async function requestCall() {
    if (!name.trim() || !reason.trim()) return setNotice("Name and reason are required.");
    setBusy(true);
    const response = await fetch("/api/call-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorKey: getStored(VISITOR_KEY), name, phone, reason }),
    });
    setBusy(false);
    setNotice(response.ok ? "Call request sent." : "Could not send call request.");
    if (response.ok) setReason("");
  }

  async function changeMessage(messageId: string, action: "edit" | "delete-me" | "delete-everyone", currentBody: string) {
    let nextBody = currentBody;
    if (action === "edit") {
      const edited = window.prompt("Edit message", currentBody);
      if (edited === null || !edited.trim()) return;
      nextBody = edited;
    } else if (!window.confirm(action === "delete-everyone" ? "Delete this message for everyone?" : "Delete this message for you?")) return;
    await fetch("/api/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, conversationId, visitorKey: getStored(VISITOR_KEY), action, message: nextBody }),
    });
    setNotice("Message updated");
  }

  function canChange(createdAt: string) {
    return Date.now() - new Date(createdAt).getTime() <= 60 * 60 * 1000;
  }

  function startMessagePress(messageId: string) {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setActiveMessageId(messageId), 550);
  }

  function stopMessagePress() {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  }

  async function handleAttachmentPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNotice("Attachment size must be 5 MB or less.");
      event.target.value = "";
      return;
    }

    const attachment = await sanitizeFileAttachment(file);
    event.target.value = "";
    if (!attachment) {
      setNotice("Unable to attach that file.");
      return;
    }

    setDraftAttachment(attachment);
    setNotice(`${attachment.name} attached.`);
  }

  const startVoiceNote = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setNotice("Voice notes are not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string") return;
          const note = {
            name: `voice-note-${Date.now()}.webm`,
            data: reader.result,
            mime: blob.type || "audio/webm",
            size: blob.size,
          };
          setVoiceNoteBlob(note);
          if (releaseRequested.current) {
            void sendWithVoice(note);
          } else {
            setNotice("Voice note ready to send.");
          }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      recordingStartedAt.current = Date.now();
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingTimer.current = window.setInterval(() => {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartedAt.current) / 1000));
      }, 250);
      if (releaseRequested.current) recorder.stop();
    } catch {
      setNotice("Microphone permission is required to record voice notes.");
    }
  };

  const stopVoiceNote = () => {
    releaseRequested.current = true;
    if (recordingTimer.current) window.clearInterval(recordingTimer.current);
    recordingTimer.current = null;
    setIsRecording(false);
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const sendWithVoice = async (note = voiceNoteBlob) => {
    if (!note || !conversationId) return;
    const attachment = {
      kind: "audio",
      name: note.name,
      mime: note.mime,
      size: note.size,
      data: note.data,
    } as ChatAttachment;
    const encryptedText = await encryptMessageText(conversationId, "Voice note");
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        visitorKey: getStored(VISITOR_KEY),
        name: name || "Visitor",
        phone,
        message: encryptedText,
        replyToId,
        attachment,
      }),
    });
    setVoiceNoteBlob(null);
    setReplyToId(null);
    releaseRequested.current = false;
  };

  function formatRecordingTime(seconds: number) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  async function reactToMessage(messageId: string, emoji: string) {
    if (!conversationId) return;
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reaction", conversationId, messageId, emoji }),
    });
    setActiveMessageId("");
  }

  const replyMessage = messages.find((item) => item.id === replyToId);

  return (
    <div className="fixed bottom-4 left-4 z-[250]">
      <GoldiBot enabled={registrationComplete} visitorName={name} onSwitchToArav={() => {
        window.dispatchEvent(new Event("open-arav-chat"));
      }} />
      {open && (
        <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-sm">
          <div className="mx-auto flex h-[100dvh] max-h-[900px] w-full max-w-5xl min-h-0 flex-col border-x border-matrix-green/30 bg-[#07140f] shadow-[0_0_60px_rgba(0,255,120,0.12)]">
            <header className="flex items-center justify-between border-b border-matrix-green/20 bg-[#0a1916] px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setOpen(false)} className="rounded-full border border-matrix-green/30 px-2 py-1 text-lg leading-none text-matrix-green" aria-label="Go back from Arav chat">←</button>
                <button type="button" onClick={() => setProfileLightbox(true)} className="h-10 w-10 overflow-hidden rounded-full border border-matrix-green/60" aria-label="View Arav Tiwari profile photo">
                  <img src="/profile.jpg" alt="Arav Tiwari" className="h-full w-full object-cover" />
                </button>
                <div className="relative">
                  <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="text-left">
                    <p className="text-base font-bold text-matrix-green">Arav Tiwari</p>
                    <p className="text-[10px] text-matrix-green/60">{lastSeenVisible && lastSeen ? `last seen ${new Date(lastSeen).toLocaleString()}` : "online"}</p>
                  </button>
                  {settingsOpen && (
                    <div className="absolute left-0 top-12 z-30 w-64 border border-matrix-green/40 bg-[#07140f] p-3 text-left shadow-[0_0_24px_rgba(0,255,120,0.25)]">
                      <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-matrix-green/60">Chat settings</p>
                      <label className="flex items-center justify-between gap-2 py-2 text-xs text-matrix-green"><span>Disappearing messages</span><select value={disappearingTimer} onChange={(event) => setDisappearingTimer(event.target.value)} className="border border-matrix-green/30 bg-black px-1 py-1 text-[10px] text-matrix-green"><option value="off">Off</option><option value="86400">24 hours</option><option value="604800">7 days</option><option value="2592000">30 days</option></select></label>
                      <label className="flex items-center gap-2 border-t border-matrix-green/20 py-2 text-xs text-matrix-green"><input type="checkbox" checked={hideBlueTicks} onChange={(event) => setHideBlueTicks(event.target.checked)} /> Hide blue ticks</label>
                      <button type="button" onClick={() => void runConversationAction("clear-me")} className="block w-full border-t border-matrix-green/20 py-2 text-left text-xs text-yellow-200">Clear chat for me</button>
                      <button type="button" onClick={() => void runConversationAction("clear-everyone")} className="block w-full py-2 text-left text-xs text-yellow-200">Clear chat for everyone</button>
                      <button type="button" onClick={() => void runConversationAction("delete-chat")} className="block w-full border-t border-red-500/30 py-2 text-left text-xs text-red-300">Delete chat</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMode("call")} className="rounded-full border border-matrix-green/40 p-2 text-matrix-green hover:bg-matrix-green hover:text-black" aria-label="Request a call from Arav" title="Request a call">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8.01 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" /></svg>
                </button>
                <div className="rounded-full border border-cyan-500/60 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-cyan-300">E2EE</div>
              </div>
            </header>

            {mode === "home" && !conversationId ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="max-w-md rounded-2xl border border-matrix-green/30 bg-black/30 p-6">
                  <p className="text-xl font-bold text-matrix-green">Send a message</p>
                  <div className="mt-4 space-y-3 text-left">
                    <input value={name} onChange={(e) => { setName(e.target.value); setNameError(false); }} placeholder="Enter your full name" className="contact-input" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Type your number" className="contact-input" />
                    <button disabled={busy} onClick={startChat} className="w-full border border-matrix-green bg-matrix-green px-3 py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50">Start chat</button>
                    {notice && <p className={`text-xs ${nameError ? "text-red-400" : "text-yellow-300"}`}>{notice}</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {mode === "chooser" && registrationComplete ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
                <div>
                  <p className="text-xl font-bold text-matrix-green">Choose a chat</p>
                  <p className="mt-2 text-xs text-matrix-green/60">Hi {name}, select who you want to talk to.</p>
                </div>
                <div className="w-full max-w-md divide-y divide-matrix-green/15 border-y border-matrix-green/20 bg-black/20">
                  <button type="button" onClick={openAravConversation} className="flex w-full items-center gap-3 p-4 text-left text-matrix-green hover:bg-matrix-green/10"><img src="/profile.jpg" alt="Arav Tiwari" className="h-12 w-12 rounded-full border border-matrix-green/60 object-cover" /><span><span className="block font-bold">Arav Tiwari</span><span className="mt-1 block text-xs text-matrix-green/60">Direct private chat</span></span></button>
                  <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event("open-goldi-chat")); }} className="flex w-full items-center gap-3 p-4 text-left text-amber-200 hover:bg-amber-300/10"><img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce0?auto=format&fit=crop&crop=faces&w=640&q=90" alt="Goldi, curly-haired girl" className="h-12 w-12 rounded-full border border-amber-300/70 object-cover" /><span><span className="block font-bold">Goldi</span><span className="mt-1 block text-xs text-amber-100/60">always online</span></span></button>
                </div>
              </div>
            ) : null}

            {mode === "call" ? (
              <div className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-2xl border border-matrix-green/30 bg-black/30 p-5">
                  <p className="text-lg font-bold text-matrix-green">Request a call</p>
                  <div className="mt-4 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="contact-input" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Type your number" className="contact-input" />
                    <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell me what you want to discuss" className="contact-input min-h-[100px]" />
                    <button disabled={busy} onClick={requestCall} className="w-full border border-matrix-green bg-matrix-green px-3 py-2 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50">Send call request</button>
                    {notice && <p className="text-xs text-yellow-300">{notice}</p>}
                  </div>
                </div>
              </div>
            ) : null}

            {conversationId && mode === "chat" ? (
              <>
                {aravWarning && <div className="mx-4 mt-3 rounded-md border border-yellow-400/50 bg-yellow-400/10 px-3 py-2 text-center text-[11px] text-yellow-200">For security, your IP address and approximate location may be processed. Please think carefully before sending a message.</div>}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="border-b border-matrix-green/20 bg-[#0d1e1a] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-matrix-green/60">
                    <span>Chat</span>
                  </div>

                  <div ref={contentRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(0,255,128,0.08),_transparent_55%)] px-3 py-3 sm:px-4 sm:py-4">
                    {messages.map((item) => {
                      const isVisitor = item.sender === "visitor";
                      const replyTarget = messages.find((message) => message.id === item.replyToId);

                      return (
                        <div key={item.id} className={`flex ${isVisitor ? "justify-end" : "justify-start"}`}>
                          <div
                            onPointerDown={() => startMessagePress(item.id)}
                            onPointerUp={stopMessagePress}
                            onPointerLeave={stopMessagePress}
                            onContextMenu={(event) => {
                              event.preventDefault();
                              setActiveMessageId(item.id);
                            }}
                            className={`max-w-[78%] rounded-2xl border px-3 py-2 text-sm ${
                              isVisitor
                                ? "border-matrix-green/40 bg-matrix-green/15 text-matrix-green"
                                : "border-matrix-green/20 bg-[#10251f] text-matrix-green"
                            }`}
                          >
                            {replyTarget && (
                              <div className="mb-2 rounded-md border border-matrix-green/20 bg-black/20 px-2 py-1 text-[10px] text-matrix-green/60">
                                Replying to: {replyTarget.body.slice(0, 55)}{replyTarget.body.length > 55 ? "..." : ""}
                              </div>
                            )}

                            {item.attachment && (
                              <div className="mb-2 overflow-hidden rounded-xl border border-matrix-green/20 bg-black/20">
                                {item.attachment.kind === "image" || item.attachment.kind === "gif" ? (
                                  <img src={item.attachment.data} alt={item.attachment.name} className="max-h-56 w-full object-cover" />
                                ) : item.attachment.kind === "video" ? (
                                  <video controls src={item.attachment.data} className="max-h-56 w-full object-cover" />
                                ) : item.attachment.kind === "audio" ? (
                                  <audio controls src={item.attachment.data} className="w-full" />
                                ) : (
                                  <a href={item.attachment.data} download={item.attachment.name} className="block p-3 text-xs underline">{item.attachment.name}</a>
                                )}
                              </div>
                            )}

                            <p className="whitespace-pre-wrap break-words">{item.body}</p>

                            <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-matrix-green/60">
                              <div className="flex gap-1">
                                {['👍','❤️','😂','🎉','😮'].map((emoji) => (
                                  <button key={emoji} onClick={() => void reactToMessage(item.id, emoji)} className="rounded-full border border-matrix-green/20 bg-black/20 px-1.5 py-0.5 text-[10px]" aria-label={`React with ${emoji}`}>{emoji}</button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <span>{formatTime(item.createdAt)}</span>
                                {isVisitor && <StatusTicks status={item.status} hideBlueTicks={hideBlueTicks} />}
                              </div>
                            </div>

                            {Array.isArray(item.reactions) && item.reactions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {item.reactions.map((emoji, idx) => (
                                  <span key={`${emoji}-${idx}`} className="rounded-full border border-matrix-green/20 bg-black/20 px-1.5 py-0.5 text-[10px]">{emoji}</span>
                                ))}
                              </div>
                            )}

                            {isVisitor && !item.deleted && activeMessageId === item.id && canChange(item.createdAt) ? (
                              <div className="mt-2 flex gap-2 text-[10px] text-matrix-green/70">
                                <button onClick={() => void changeMessage(item.id, "edit", item.body)}>Edit</button>
                                <button onClick={() => void changeMessage(item.id, "delete-me", item.body)}>Delete</button>
                                <button onClick={() => setReplyToId(item.id)}>Reply</button>
                              </div>
                            ) : null}

                            {!isVisitor && !item.deleted && activeMessageId === item.id && canChange(item.createdAt) ? (
                              <div className="mt-2 flex gap-2 text-[10px] text-matrix-green/70">
                                <button onClick={() => void changeMessage(item.id, "edit", item.body)}>Edit</button>
                                <button onClick={() => setReplyToId(item.id)}>Reply</button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} aria-hidden="true" />
                  </div>

                  <div className="border-t border-matrix-green/20 bg-[#0a1916] p-3">
                    {replyToId && (
                      <div className="mb-2 flex items-center justify-between rounded-md border border-matrix-green/30 bg-black/20 p-2 text-[10px] text-matrix-green/70">
                        <span>Replying to {replyMessage?.body?.slice(0, 30) || "message"}</span>
                        <button onClick={() => setReplyToId(null)} className="text-matrix-green">Dismiss</button>
                      </div>
                    )}

                    {draftAttachment && (
                      <div className="mb-2 flex items-center justify-between rounded-md border border-cyan-500/40 bg-cyan-500/10 p-2 text-[10px] text-cyan-200">
                        <span>{draftAttachment.name}</span>
                        <button onClick={() => setDraftAttachment(null)} className="text-cyan-200">Remove</button>
                      </div>
                    )}

                    {voiceNoteBlob && (
                      <div className="mb-2 flex items-center justify-between rounded-md border border-pink-500/40 bg-pink-500/10 p-2 text-[10px] text-pink-200">
                        <span>{voiceNoteBlob.name}</span>
                        <button onClick={() => setVoiceNoteBlob(null)} className="text-pink-200">Remove</button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
                      <button onClick={() => fileInputRef.current?.click()} className="rounded-full border border-matrix-green/40 p-2 text-lg text-matrix-green" aria-label="Attach file">📎</button>
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar" onChange={handleAttachmentPick} />
                      <button
                        type="button"
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId);
                          releaseRequested.current = false;
                          void startVoiceNote();
                        }}
                        onPointerUp={stopVoiceNote}
                        onPointerCancel={stopVoiceNote}
                        onPointerLeave={(event) => {
                          if (event.currentTarget.hasPointerCapture(event.pointerId)) stopVoiceNote();
                        }}
                        className={`rounded-full border p-2 text-lg ${isRecording ? "border-red-400 bg-red-500/20 text-red-200" : "border-pink-400/50 bg-pink-500/10 text-pink-200"}`}
                        aria-label="Hold to record voice note"
                        title="Hold to record, release to send"
                      >
                        🎙️
                      </button>
                      <button onClick={() => setMessage((value) => value + "😊")} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2 text-lg text-cyan-200" aria-label="Add emoji">😊</button>
                      <textarea
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Type a message"
                        rows={1}
                        className="min-h-[42px] min-w-[min(180px,100%)] flex-1 resize-none rounded-full border border-matrix-green/30 bg-black/30 px-3 py-2 text-sm text-matrix-green placeholder:text-matrix-green/40"
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            if (!busy) void sendMessage();
                          }
                        }}
                      />
                      <button
                        onClick={async () => {
                          if (voiceNoteBlob) {
                            await sendWithVoice();
                            return;
                          }
                          await sendMessage();
                        }}
                        disabled={busy}
                        className="rounded-full border border-matrix-green bg-matrix-green px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                    {isRecording && <p className="mt-2 text-[10px] text-red-300">Recording {formatRecordingTime(recordingSeconds)} · release to send</p>}
                    {notice && !isRecording && <p className="mt-2 text-[10px] text-yellow-300">{notice}</p>}
                  </div>
                </div>
              </>
            ) : null}

          </div>
        </div>
      )}

      {profileLightbox && (
        <button type="button" onClick={() => setProfileLightbox(false)} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-6" aria-label="Close profile photo">
          <img src="/profile.jpg" alt="Arav Tiwari" className="max-h-full max-w-full object-contain" />
        </button>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="group relative h-16 w-16 overflow-hidden rounded-full border-2 border-matrix-green bg-black shadow-[0_0_22px_rgba(0,255,120,0.5)]"
        aria-label="Chat with Arav"
      >
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=face" alt="Contact Arav" className="h-full w-full object-cover" />
        <span className="absolute bottom-0 left-0 right-0 bg-black/75 py-0.5 text-[8px] text-matrix-green">CHAT</span>
      </button>
    </div>
  );
}