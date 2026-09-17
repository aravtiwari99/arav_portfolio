import { NextResponse } from "next/server";
import { getAdminPresence } from "@/lib/contactStore";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getAdminPresence());
}