import { NextResponse } from "next/server";
import { addMessage, conversationExists, createConversation, getConversation, updateVisitorMessage } from "@/lib/contactStore";

function validText(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max;
}

export async function GET(request: Request) {
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ exists: false, messages: [] });
  return NextResponse.json({ exists: await conversationExists(conversationId), messages: await getConversation(conversationId) });
}

export async function PATCH(request: Request) {
  const { messageId, conversationId, visitorKey, action, message } = await request.json();
  if (
    typeof messageId !== "string" || typeof conversationId !== "string" ||
    typeof visitorKey !== "string" || !["edit", "delete-me", "delete-everyone"].includes(action)
  ) return NextResponse.json({ error: "Invalid message action." }, { status: 400 });
  const updated = await updateVisitorMessage(messageId, conversationId, visitorKey, action, message);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Message can no longer be changed." }, { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { conversationId, visitorKey, name, phone, message } = body;
  if (
    !validText(visitorKey, 160) ||
    !validText(name, 80) ||
    (phone !== undefined && phone !== "" && !validText(phone, 30)) ||
    !validText(message, 2000)
  ) {
    return NextResponse.json({ error: "Please provide a valid name and message." }, { status: 400 });
  }

  const id = validText(conversationId, 100)
    ? conversationId
    : await createConversation(visitorKey.trim(), name.trim(), phone?.trim());
  await addMessage(id, "visitor", message.trim());
  return NextResponse.json({ ok: true, conversationId: id });
}