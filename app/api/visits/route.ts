import { NextResponse } from "next/server";
import { isIP } from "net";
import { recordVisit } from "@/lib/locationStore";

function getPublicIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0].trim();
  const candidate = forwarded || request.headers.get("x-real-ip") || "";
  return isIP(candidate) ? candidate : undefined;
}

export async function POST(request: Request) {
  const { visitorId } = await request.json();
  if (typeof visitorId !== "string" || visitorId.length < 10 || visitorId.length > 100) {
    return NextResponse.json({ error: "Invalid visitor ID." }, { status: 400 });
  }

  recordVisit(visitorId, {
    publicIp: getPublicIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 300),
  });
  return NextResponse.json({ ok: true });
}
