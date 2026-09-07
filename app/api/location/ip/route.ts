import { NextResponse } from "next/server";
import { isIP } from "net";
import { recordVisit, saveVisitorLocation } from "@/lib/locationStore";

interface IpLocationResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  country_name?: string;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip");
  return candidate && isIP(candidate) ? candidate : undefined;
}

export async function POST(request: Request) {
  const { visitorId } = await request.json();
  if (typeof visitorId !== "string" || visitorId.length < 10 || visitorId.length > 100) {
    return NextResponse.json({ error: "Invalid visitor ID." }, { status: 400 });
  }

  recordVisit(visitorId);
  const ip = getClientIp(request);
  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return NextResponse.json({ error: "IP location unavailable." }, { status: 503 });
  }

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return NextResponse.json({ error: "IP location unavailable." }, { status: 503 });

    const result = (await response.json()) as IpLocationResponse;
    if (typeof result.latitude !== "number" || typeof result.longitude !== "number") {
      return NextResponse.json({ error: "IP location unavailable." }, { status: 503 });
    }

    saveVisitorLocation(visitorId, {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: 25000,
      source: "ip",
      city: result.city,
      region: result.region,
      country: result.country_name,
      recordedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "IP location unavailable." }, { status: 503 });
  }
}
