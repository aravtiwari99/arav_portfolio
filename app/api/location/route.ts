import { NextResponse } from "next/server";
import { saveVisitorLocation } from "@/lib/locationStore";

export async function POST(request: Request) {
  const body = await request.json();
  const { visitorId, latitude, longitude, accuracy, source } = body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof accuracy !== "number" ||
    typeof visitorId !== "string" ||
    source !== "browser" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    accuracy < 0
  ) {
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  }

  const saved = saveVisitorLocation(visitorId, {
    latitude,
    longitude,
    accuracy,
    source,
    recordedAt: new Date().toISOString(),
  });

  return saved
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Visit record not found." }, { status: 404 });
}
