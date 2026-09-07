import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminPassword,
  getAdminUsername,
  passwordsMatch,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const configuredUsername = getAdminUsername();
  const configuredPassword = getAdminPassword();

  if (!configuredUsername || !configuredPassword || typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Admin login is not configured on this deployment." },
      { status: 500 },
    );
  }

  const validUsername = username === configuredUsername;
  const validPassword = passwordsMatch(configuredPassword, password);

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(configuredUsername, configuredPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
