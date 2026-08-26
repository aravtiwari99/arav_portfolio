import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "arav_admin_session";

function createSession(username: string, password: string) {
  return createHmac("sha256", password).update(username).digest("hex");
}

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredUsername || !configuredPassword || typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Admin login is not configured on this deployment." },
      { status: 500 },
    );
  }

  const validUsername = username === configuredUsername;
  const expectedPassword = Buffer.from(configuredPassword);
  const receivedPassword = Buffer.from(password);
  const validPassword =
    expectedPassword.length === receivedPassword.length &&
    timingSafeEqual(expectedPassword, receivedPassword);

  if (!validUsername || !validPassword) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, createSession(configuredUsername, configuredPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
