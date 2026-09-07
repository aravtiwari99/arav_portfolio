import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  changeAdminPassword,
  createAdminSession,
  getAdminPassword,
  getAdminUsername,
  isAuthenticated,
  passwordsMatch,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!isAuthenticated()) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();
  const configuredPassword = await getAdminPassword();
  const username = getAdminUsername();

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    !configuredPassword ||
    !username ||
    !passwordsMatch(configuredPassword, currentPassword)
  ) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  if (newPassword.length < 12) {
    return NextResponse.json(
      { error: "New password must be at least 12 characters." },
      { status: 400 },
    );
  }

  await changeAdminPassword(newPassword);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSession(username, newPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/",
  });
  return response;
}
