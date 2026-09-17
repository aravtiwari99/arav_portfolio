"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "home" | "chat" | "call";
type Message = { id: string; sender: "visitor" | "admin"; body: string; createdAt: string; editedAt?: string; deleted?: boolean };

const VISITOR_KEY = "arav_contact_visitor";
const CONVERSATION_KEY = "arav_contact_conversation";

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
  const [busy, setBusy] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [activeMessageId, setActiveMessageId] = useState("");
  const lastAdminCount = useRef(0);
  const pressTimer = useRef<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CONVERSATION_KEY);
    if (saved) setConversationId(saved);
  }, []);

  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      const response = await fetch(`/api/chat?conversationId=${encodeURIComponent(conversationId)}`);
      if (!response.ok) return;
      const result = (await response.json()) as { exists: boolean; messages: Message[] };
      if (!result.exists) {
        localStorage.removeItem(CONVERSATION_KEY);
        document.cookie = `${CONVERSATION_KEY}=; Max-Age=0; Path=/; SameSite=Lax`;
        setConversationId("");
        setMessages([]);
        return;
      }
      const adminCount = result.messages.filter((item) => item.sender === "admin").length;
      if (adminCount > lastAdminCount.current && lastAdminCount.current > 0) {
        setNotice("New reply from Arav");
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New reply from Arav", { body: result.messages[result.messages.length - 1]?.body });
        }
      }
      lastAdminCount.current = adminCount;
      setMessages(result.messages);
    };
    const loadPresence = async () => {
      const response = await fetch("/api/presence");
      if (!response.ok) return;
      const result = (await response.json()) as { lastSeen: string | null; visible: boolean };
      setLastSeen(result.lastSeen); setLastSeenVisible(result.visible);
    };
    void load();
    void loadPresence();
    const timer = window.setInterval(() => { void load(); void loadPresence(); }, 4000);
    return () => window.clearInterval(timer);
  }, [conversationId]);

  async function startChat() {
    if (!name.trim()) return setNotice("Please enter your name.");
    setBusy(true);
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorKey: getStored(VISITOR_KEY), name, phone,
        message: "Hello, I would like to connect.",
      }),
    });
    const result = (await response.json()) as { conversationId?: string; error?: string };
    setBusy(false);
    if (!response.ok || !result.conversationId) return setNotice(result.error || "Could not start chat.");
    localStorage.setItem(CONVERSATION_KEY, result.conversationId);
    setConversationId(result.conversationId);
    setMode("chat");
    setNotice("");
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  }

  async function sendMessage() {
    if (!message.trim() || !conversationId) return;
    setBusy(true);
    await fetch("/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, visitorKey: getStored(VISITOR_KEY), name: name || "Visitor", phone, message }),
    });
    setMessage("");
    setBusy(false);
  }

  async function requestCall() {
    if (!name.trim() || !reason.trim()) return setNotice("Name and reason are required.");
    setBusy(true);
    const response = await fetch("/api/call-request", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
    await fetch("/api/chat", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, conversationId, visitorKey: getStored(VISITOR_KEY), action, message: nextBody }) });
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

  return (
    <div className="fixed bottom-5 left-5 z-[250] flex flex-col items-start gap-3">
      {open && (
        <div className="w-[min(92vw,360px)] overflow-hidden rounded-xl border border-matrix-green/60 bg-black/95 shadow-[0_0_28px_rgba(0,255,120,0.25)]">
          <div className="flex items-center justify-between border-b border-matrix-green/30 px-4 py-3">
            <div><p className="text-sm font-bold text-matrix-green">Connect with Arav</p><p className="text-[10px] text-matrix-green/60">{lastSeenVisible && lastSeen ? `Last seen ${new Date(lastSeen).toLocaleString()}` : "Last seen recently"}</p></div>
            <button onClick={() => setOpen(false)} className="text-xl text-matrix-green/70" aria-label="Close contact panel">×</button>
          </div>
          <div className="flex border-b border-matrix-green/20 text-xs">
            <button onClick={() => setMode("chat")} className={`flex-1 px-3 py-3 ${mode === "chat" ? "bg-matrix-green text-black" : "text-matrix-green"}`}>Chat</button>
            <button onClick={() => setMode("call")} className={`flex-1 px-3 py-3 ${mode === "call" ? "bg-matrix-green text-black" : "text-matrix-green"}`}>☎ Call request</button>
          </div>
          {mode === "home" && <div className="p-4 text-sm text-matrix-green/80">Choose chat or request a call.</div>}
          {mode !== "chat" || !conversationId ? (
            mode === "call" || (mode === "chat" && !conversationId) ? (
              <div className="space-y-3 p-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="contact-input" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number (optional)" className="contact-input" />
                {mode === "call" ? <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for call" className="contact-input min-h-20" /> : null}
                <button disabled={busy} onClick={mode === "call" ? requestCall : startChat} className="w-full border border-matrix-green px-3 py-2 text-xs text-matrix-green hover:bg-matrix-green hover:text-black disabled:opacity-50">{mode === "call" ? "Send call request" : "Start chat"}</button>
                {notice && <p className="text-xs text-yellow-300">{notice}</p>}
              </div>
            ) : null
          ) : (
            <div className="p-3">
              <div className="mb-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                {messages.map((item) => <div key={item.id} onPointerDown={() => startMessagePress(item.id)} onPointerUp={stopMessagePress} onPointerLeave={stopMessagePress} onContextMenu={(event) => { event.preventDefault(); setActiveMessageId(item.id); }} className={`group max-w-[88%] rounded px-3 py-2 text-xs ${item.sender === "admin" ? "mr-auto bg-matrix-green/15 text-matrix-green" : "ml-auto bg-white/10 text-white"}`}><p>{item.body} {item.editedAt && !item.deleted ? <span className="text-[9px] opacity-50">(edited)</span> : null}</p>{item.sender === "visitor" && !item.deleted && activeMessageId === item.id && canChange(item.createdAt) && <div className="mt-1 flex gap-2 text-[9px] opacity-70"><button onClick={() => void changeMessage(item.id, "edit", item.body)}>Edit</button><button onClick={() => void changeMessage(item.id, "delete-me", item.body)}>Delete for me</button><button onClick={() => void changeMessage(item.id, "delete-everyone", item.body)}>Delete everyone</button></div>}</div>)}
              </div>
              {notice && <p className="mb-2 text-xs text-yellow-300">{notice}</p>}
              <div className="flex gap-2"><input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void sendMessage(); }} placeholder="Type a message" className="contact-input" /><button disabled={busy} onClick={() => void sendMessage()} className="border border-matrix-green px-3 text-xs text-matrix-green">Send</button></div>
            </div>
          )}
        </div>
      )}
      <button onClick={() => { setOpen((value) => !value); if (!open && mode === "home") setMode(conversationId ? "chat" : "chat"); }} className="group relative h-16 w-16 overflow-hidden rounded-full border-2 border-matrix-green bg-black shadow-[0_0_22px_rgba(0,255,120,0.55)]" aria-label="Open chat and call options">
        <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&crop=face" alt="Contact Arav" className="h-full w-full object-cover" />
        <span className="absolute bottom-0 left-0 right-0 bg-black/75 py-0.5 text-[8px] text-matrix-green">CHAT</span>
      </button>
    </div>
  );
}