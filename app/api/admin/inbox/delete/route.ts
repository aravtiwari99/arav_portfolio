import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/adminAuth";
import { deleteCallRequest, deleteConversation } from "@/lib/contactStore";

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  if (body.type === "conversation" && typeof body.id === "string") {
    await deleteConversation(body.id);
    return NextResponse.json({ ok: true });
  }
  if (body.type === "call" && typeof body.id === "string") {
    await deleteCallRequest(body.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid delete request." }, { status: 400 });
}