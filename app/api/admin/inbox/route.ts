import { NextResponse } from "next/server";
import { getInbox, getCallRequests, getRetention, setRetention, setAdminPresenceVisible, touchAdminPresence, getAdminPresence, markAllVisitorMessagesSeen, type Retention } from "@/lib/contactStore";
import { isAuthenticated } from "@/lib/adminAuth";

const RETENTIONS: Retention[] = ["off", "24h", "7d", "30d"];

export async function GET() {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  await touchAdminPresence();
  await markAllVisitorMessagesSeen();
  return NextResponse.json({ conversations: await getInbox(), callRequests: await getCallRequests(), retention: await getRetention(), presence: await getAdminPresence() });
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json();
  if (body.action === "retention" && RETENTIONS.includes(body.value)) {
    await setRetention(body.value);
    return NextResponse.json({ ok: true });
  }
  if (body.action === "presence" && typeof body.visible === "boolean") {
    await setAdminPresenceVisible(body.visible);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Invalid inbox action." }, { status: 400 });
}