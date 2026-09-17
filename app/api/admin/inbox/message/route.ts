import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { updateAdminMessage } from "@/lib/contactStore";

export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { messageId, action, message } = await request.json();
  if (typeof messageId !== "string" || !["edit", "delete-me", "delete-everyone"].includes(action)) {
    return NextResponse.json({ error: "Invalid message action." }, { status: 400 });
  }
  const updated = await updateAdminMessage(messageId, action, message);
  return updated ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Message can no longer be changed." }, { status: 403 });
}