import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/locationStore";

export async function POST(request: Request) {
  const { visitorId } = await request.json();
  if (typeof visitorId !== "string" || visitorId.length < 10 || visitorId.length > 100) {
    return NextResponse.json({ error: "Invalid visitor ID." }, { status: 400 });
  }

  recordVisit(visitorId);
  return NextResponse.json({ ok: true });
}
