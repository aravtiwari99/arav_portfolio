import { NextResponse } from "next/server";
import { updateCallStatus } from "@/lib/contactStore";
import { isAuthenticated } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { id, status } = await request.json();
  if (typeof id !== "string" || !["pending", "contacted", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid call request update." }, { status: 400 });
  }
  await updateCallStatus(id, status);
  return NextResponse.json({ ok: true });
}