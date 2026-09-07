import { NextResponse } from "next/server";
import { saveVisitorLocation } from "@/lib/locationStore";

export async function POST(request: Request) {
  const body = await request.json();
  const { latitude, longitude, accuracy } = body;

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    typeof accuracy !== "number" ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    accuracy < 0
  ) {
    return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  }

  saveVisitorLocation({
    latitude,
    longitude,
    accuracy,
    recordedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
