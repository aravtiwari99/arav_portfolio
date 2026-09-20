import { NextResponse } from "next/server";
import { addMessage, clearVisitorMessages, conversationExists, createConversation, deleteVisitorConversation, getConversation, toggleMessageReaction, updateVisitorMessage } from "@/lib/contactStore";

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
  if (action === "clear-me" || action === "clear-everyone" || action === "delete-chat") {
    if (typeof conversationId !== "string" || typeof visitorKey !== "string") {
      return NextResponse.json({ error: "Invalid conversation action." }, { status: 400 });
    }
    const updated = action === "delete-chat"
      ? await deleteVisitorConversation(conversationId, visitorKey)
      : await clearVisitorMessages(conversationId, visitorKey, action === "clear-everyone");
    return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  if (
    typeof messageId !== "string" || typeof conversationId !== "string" ||
    typeof visitorKey !== "string" || !["edit", "delete-me", "delete-everyone"].includes(action)
  ) return NextResponse.json({ error: "Invalid message action." }, { status: 400 });
  const updated = await updateVisitorMessage(messageId, conversationId, visitorKey, action, message);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Message can no longer be changed." }, { status: 403 });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body?.action === "reaction") {
    const { conversationId, messageId, emoji } = body;
    if (typeof conversationId !== "string" || typeof messageId !== "string" || typeof emoji !== "string" || !emoji.trim()) {
      return NextResponse.json({ error: "Invalid message reaction." }, { status: 400 });
    }
    const reactions = await toggleMessageReaction(messageId, conversationId, emoji.trim());
    return NextResponse.json({ ok: true, reactions });
  }

  const { conversationId, visitorKey, name, phone, message, replyToId, attachment, expiresInSeconds } = body;
  if (
    !validText(visitorKey, 160) ||
    (typeof name !== "string" || name.trim().length > 80) ||
    (phone !== undefined && phone !== "" && !validText(phone, 30)) ||
    (typeof message !== "string" || !message.trim() || message.trim().length > 2000)
  ) {
    return NextResponse.json({ error: "Please provide a valid name and message." }, { status: 400 });
  }

  const id = validText(conversationId, 100)
    ? conversationId
    : await createConversation(visitorKey.trim(), name.trim(), phone?.trim());

  await addMessage(id, "visitor", message.trim(), {
    replyToId: typeof replyToId === "string" ? replyToId : null,
    attachment: attachment && typeof attachment === "object" ? attachment : null,
    status: "sent",
    expiresInSeconds: typeof expiresInSeconds === "number" && expiresInSeconds > 0 ? Math.min(expiresInSeconds, 30 * 24 * 60 * 60) : undefined,
  });
  return NextResponse.json({ ok: true, conversationId: id });
}