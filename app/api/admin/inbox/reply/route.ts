import { NextResponse } from "next/server";
import { addMessage } from "@/lib/contactStore";
import { isAuthenticated } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { conversationId, message, replyToId, attachment } = await request.json();
  if (typeof conversationId !== "string" || typeof message !== "string" || !message.trim() || message.length > 2000) {
    return NextResponse.json({ error: "Invalid reply." }, { status: 400 });
  }
  await addMessage(conversationId, "admin", message.trim(), {
    status: "delivered",
    replyToId: typeof replyToId === "string" ? replyToId : null,
    attachment: attachment && typeof attachment === "object" ? attachment : null,
  });
  return NextResponse.json({ ok: true });
}