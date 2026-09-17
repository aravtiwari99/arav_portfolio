"use client";

import { useEffect, useState } from "react";

type Message = { id: string; sender: "visitor" | "admin"; body: string; createdAt: string; editedAt?: string; deleted?: boolean };
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

  async function load() {
    const response = await fetch("/api/admin/inbox");
    if (!response.ok) return;
    const result = await response.json();
    setConversations(result.conversations);
    setCalls(result.callRequests);
    setRetention(result.retention);
    setPresenceVisible(result.presence?.visible ?? true);
    if (!selected && result.conversations[0]) setSelected(result.conversations[0].id);
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [selected]);

  async function deleteItems(type: "conversation" | "call", ids: string[]) {
    if (!ids.length || !window.confirm(type === "conversation" ? "Delete selected chat history permanently?" : "Delete selected call requests permanently?")) return;
    await Promise.all(ids.map((id) => fetch("/api/admin/inbox/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    })));
    if (type === "conversation") {
      setSelectedConversations([]);
      setSelected("");
    } else {
      setSelectedCalls([]);
    }
    setNotice("Deleted permanently from Supabase");
    void load();
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    await fetch("/api/admin/inbox/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selected, message: reply }),
    });
    setReply("");
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
    <section className="mt-8 border border-matrix-green/40 p-6 glow-border">
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
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(150px,0.8fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          {conversations.length === 0 ? <p className="text-xs text-matrix-green/60">No conversations yet.</p> : conversations.map((item) => (
            <div key={item.id} className={`flex w-full gap-2 border p-3 text-left text-xs ${selected === item.id ? "border-matrix-green bg-matrix-green/10" : "border-matrix-green/20"}`}>
              <input type="checkbox" checked={selectedConversations.includes(item.id)} onChange={(event) => setSelectedConversations((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
              <button type="button" onClick={() => setSelected(item.id)} className="min-w-0 text-left"><span className="block font-bold">{item.visitorName}</span><span className="text-matrix-green/60">{new Date(item.updatedAt).toLocaleString()}</span></button>
            </div>
          ))}
        </div>
        <div className="border border-matrix-green/20 p-3">
          {active ? (
            <>
              <p className="mb-3 text-xs text-matrix-green/60">{active.visitorName}{active.phone ? ` · ${active.phone}` : ""}</p>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {active.messages.map((item) => (
                  <div key={item.id} className={`group max-w-[88%] rounded px-3 py-2 text-xs ${item.sender === "admin" ? "ml-auto bg-matrix-green/15" : "mr-auto bg-white/10"}`}>
                    <p><span className="mr-2 text-[10px] text-matrix-green/50">{item.sender}</span>{item.body}</p>
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
