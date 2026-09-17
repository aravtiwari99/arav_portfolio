import { NextResponse } from "next/server";
import { addCallRequest } from "@/lib/contactStore";

export async function POST(request: Request) {
  const { visitorKey, name, phone, reason } = await request.json();
  if (
    typeof visitorKey !== "string" || visitorKey.length < 10 || visitorKey.length > 160 ||
    typeof name !== "string" || name.trim().length < 2 || name.length > 80 ||
    (phone !== undefined && phone !== "" && (typeof phone !== "string" || phone.length > 30)) ||
    typeof reason !== "string" || reason.trim().length < 2 || reason.length > 500
  ) {
    return NextResponse.json({ error: "Please complete the call request form." }, { status: 400 });
  }
  await addCallRequest(visitorKey, name.trim(), phone?.trim(), reason.trim());
  return NextResponse.json({ ok: true });
}