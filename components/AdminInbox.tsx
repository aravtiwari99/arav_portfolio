"use client";

import { useEffect, useRef, useState } from "react";

type Attachment = { kind: "image" | "video" | "audio" | "document" | "gif"; name: string; mime: string; data: string };
type Message = { id: string; sender: "visitor" | "admin"; body: string; createdAt: string; editedAt?: string; deleted?: boolean; attachment?: Attachment | null; reactions?: string[] };
type Conversation = { id: string; visitorName: string; phone?: string; updatedAt: string; messages: Message[] };
type CallRequest = { id: string; visitorName: string; phone?: string; reason: string; createdAt: string; status: string };
type InboxView = "messages" | "calls";

export default function AdminInbox({ view }: { view: InboxView }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [calls, setCalls] = useState<CallRequest[]>([]);
  const [retention, setRetention] = useState("off");
  const [presenceVisible, setPresenceVisible] = useState(true);
  const [selected, setSelected] = useState("");
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);
  const [reply, setReply] = useState("");
  const [notice, setNotice] = useState("");
  const selectedRef = useRef("");

  async function load() {
    const response = await fetch("/api/admin/inbox", { cache: "no-store" });
    if (!response.ok) return;
    const result = await response.json();
    setConversations((current) => {
      const activeId = selectedRef.current;
      const currentActive = current.find((item) => item.id === activeId);
      const nextActive = result.conversations.find((item: Conversation) => item.id === activeId);
      if (currentActive && nextActive && currentActive.updatedAt === nextActive.updatedAt) {
        return result.conversations.map((item: Conversation) => item.id === selected ? currentActive : item);
      }
      return result.conversations;
    });
    setCalls(result.callRequests);
    setRetention(result.retention);
    setPresenceVisible(result.presence?.visible ?? true);
    setSelected((current) => {
      const next = current || result.conversations[0]?.id || "";
      selectedRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function deleteItems(type: "conversation" | "call", ids: string[]) {
    if (!ids.length || !window.confirm(type === "conversation" ? "Delete selected chat history permanently?" : "Delete selected call requests permanently?")) return;
    await Promise.all(ids.map((id) => fetch("/api/admin/inbox/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    })));
    if (type === "conversation") {
      setSelectedConversations([]);
      selectedRef.current = "";
      setSelected("");
    } else {
      setSelectedCalls([]);
    }
    setNotice("Deleted permanently from Supabase");
    void load();
  }

  function toggleAllConversations() {
    setSelectedConversations((current) => current.length === conversations.length ? [] : conversations.map((item) => item.id));
  }

  function toggleAllCalls() {
    setSelectedCalls((current) => current.length === calls.length ? [] : calls.map((item) => item.id));
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    const replyText = reply.trim();
    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      sender: "admin",
      body: replyText,
      createdAt: new Date().toISOString(),
    };
    setConversations((current) => current.map((conversation) => conversation.id === selected
      ? { ...conversation, updatedAt: optimisticMessage.createdAt, messages: [...conversation.messages, optimisticMessage] }
      : conversation));
    setReply("");
    await fetch("/api/admin/inbox/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected, message: replyText }),
    });
    setNotice("Reply sent");
    void load();
  }

  async function changeRetention(value: string) {
    setRetention(value);
    await fetch("/api/admin/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "retention", value }),
    });
  }

  async function changePresence(visible: boolean) {
    setPresenceVisible(visible);
    await fetch("/api/admin/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "presence", visible }),
    });
  }

  async function updateCall(id: string, status: string) {
    await fetch("/api/admin/inbox/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  }

  async function changeMessage(messageId: string, action: "edit" | "delete-everyone", currentBody: string) {
    let message = currentBody;
    if (action === "edit") {
      const edited = window.prompt("Edit message", currentBody);
      if (edited === null || !edited.trim()) return;
      message = edited;
    } else if (!window.confirm("Delete this message for everyone?")) {
      return;
    }
    await fetch("/api/admin/inbox/message", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action, message }),
    });
    void load();
  }

  function canChange(createdAt: string) {
    return Date.now() - new Date(createdAt).getTime() <= 60 * 60 * 1000;
  }

  const active = conversations.find((item) => item.id === selected);

  if (view === "calls") {
    return (
      <section className="mt-8 border border-matrix-green/40 p-6 glow-border">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Call requests</h2>
            <p className="mt-1 text-xs text-matrix-green/60">Select requests to permanently delete them.</p>
          </div>
          <button type="button" disabled={!selectedCalls.length} onClick={() => void deleteItems("call", selectedCalls)} className="border border-red-500/60 px-3 py-2 text-xs text-red-300 disabled:opacity-40">Delete selected</button>
          <button type="button" disabled={!calls.length} onClick={toggleAllCalls} className="border border-matrix-green/40 px-3 py-2 text-xs text-matrix-green disabled:opacity-40">{selectedCalls.length === calls.length ? "Clear selection" : "Select all"}</button>
        </div>
        {calls.length === 0 ? <p className="mt-4 text-xs text-matrix-green/60">No call requests yet.</p> : (
          <div className="mt-4 space-y-2">
            {calls.map((item) => (
              <div key={item.id} className="flex gap-3 border border-matrix-green/20 p-3 text-xs">
                <input type="checkbox" checked={selectedCalls.includes(item.id)} onChange={(event) => setSelectedCalls((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
                <div>
                  <p className="font-bold">{item.visitorName}{item.phone ? ` · ${item.phone}` : ""}</p>
                  <p className="mt-1 text-matrix-green/80">{item.reason}</p>
                  <p className="mt-1 text-matrix-green/50">{new Date(item.createdAt).toLocaleString()} · {item.status}</p>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => void updateCall(item.id, "contacted")} className="border border-matrix-green/40 px-2 py-1">Contacted</button>
                    <button onClick={() => void updateCall(item.id, "closed")} className="border border-matrix-green/40 px-2 py-1">Close</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto mt-4 min-h-[calc(100vh-9rem)] w-full border border-matrix-green/40 p-3 glow-border sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Messages</h2>
          <p className="mt-1 text-xs text-matrix-green/60">Select chats to permanently delete them.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-matrix-green/80">
          <label>Expiry <select value={retention} onChange={(event) => void changeRetention(event.target.value)} className="ml-2 border border-matrix-green/50 bg-black px-2 py-2 text-matrix-green"><option value="off">Never</option><option value="24h">24 hours</option><option value="7d">7 days</option><option value="30d">30 days</option></select></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={presenceVisible} onChange={(event) => void changePresence(event.target.checked)} /> Show last seen</label>
        </div>
      </div>
      <button type="button" disabled={!selectedConversations.length} onClick={() => void deleteItems("conversation", selectedConversations)} className="mt-4 border border-red-500/60 px-3 py-2 text-xs text-red-300 disabled:opacity-40">Delete selected chats</button>
      <button type="button" disabled={!conversations.length} onClick={toggleAllConversations} className="ml-2 mt-4 border border-matrix-green/40 px-3 py-2 text-xs text-matrix-green disabled:opacity-40">{selectedConversations.length === conversations.length ? "Clear selection" : "Select all chats"}</button>
      <div className="mt-4 grid min-h-[calc(100vh-18rem)] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="max-h-[calc(100vh-18rem)] space-y-2 overflow-y-auto">
          {conversations.length === 0 ? <p className="text-xs text-matrix-green/60">No conversations yet.</p> : conversations.map((item) => (
            <div key={item.id} className={`flex w-full gap-2 border p-3 text-left text-xs ${selected === item.id ? "border-matrix-green bg-matrix-green/10" : "border-matrix-green/20"}`}>
              <input type="checkbox" checked={selectedConversations.includes(item.id)} onChange={(event) => setSelectedConversations((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
              <button type="button" onPointerDown={() => { selectedRef.current = item.id; setSelected(item.id); }} onClick={() => { selectedRef.current = item.id; setSelected(item.id); }} className="min-w-0 text-left"><span className="block font-bold">{item.visitorName}</span><span className="text-matrix-green/60">{new Date(item.updatedAt).toLocaleString()}</span></button>
            </div>
          ))}
        </div>
        <div className="flex min-h-[calc(100vh-18rem)] flex-col border border-matrix-green/20 p-3">
          {active ? (
            <>
              <p className="mb-3 text-xs text-matrix-green/60">{active.visitorName}{active.phone ? ` · ${active.phone}` : ""}</p>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                {active.messages.map((item) => (
                  <div key={item.id} className={`group max-w-[88%] rounded px-3 py-2 text-xs ${item.sender === "admin" ? "ml-auto bg-matrix-green/15" : "mr-auto bg-white/10"}`}>
                    {item.attachment && <div className="mb-2 overflow-hidden border border-matrix-green/20 bg-black/20 p-1">
                      {item.attachment.kind === "image" || item.attachment.kind === "gif" ? <img src={item.attachment.data} alt={item.attachment.name} className="max-h-48 max-w-full object-contain" /> : item.attachment.kind === "video" ? <video controls src={item.attachment.data} className="max-h-48 max-w-full" /> : item.attachment.kind === "audio" ? <audio controls src={item.attachment.data} className="max-w-full" /> : <a href={item.attachment.data} download={item.attachment.name} className="block p-2 underline">{item.attachment.name}</a>}
                    </div>}
                    <p><span className="mr-2 text-[10px] text-matrix-green/50">{item.sender}</span>{item.body}</p>
                    {item.reactions && item.reactions.length > 0 && <div className="mt-1 text-sm">{item.reactions.join(" ")}</div>}
                    {item.sender === "admin" && !item.deleted && canChange(item.createdAt) && <div className="mt-1 flex gap-2 text-[9px] opacity-70"><button onClick={() => void changeMessage(item.id, "edit", item.body)}>Edit</button><button onClick={() => void changeMessage(item.id, "delete-everyone", item.body)}>Delete</button></div>}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2"><input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply" className="contact-input" /><button onClick={() => void sendReply()} className="border border-matrix-green px-3 text-xs text-matrix-green">Reply</button></div>
              {notice && <p className="mt-2 text-xs text-yellow-300">{notice}</p>}
            </>
          ) : <p className="text-xs text-matrix-green/60">Select a conversation.</p>}
        </div>
      </div>
    </section>
  );
}
