import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "arav_admin_session";
const DEFAULT_ADMIN_USERNAME = "aravadmin";
const DEFAULT_ADMIN_PASSWORD = "AravPortfolio-Admin-2026!";

declare global {
  var activeAdminPassword: string | undefined;
}

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
}

export function getAdminPassword() {
  if (globalThis.activeAdminPassword === undefined) {
    globalThis.activeAdminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  }
  return globalThis.activeAdminPassword;
}

export function createAdminSession(username: string, password: string) {
  return createHmac("sha256", password).update(username).digest("hex");
}

export function passwordsMatch(expectedPassword: string, receivedPassword: string) {
  const expected = Buffer.from(expectedPassword);
  const received = Buffer.from(receivedPassword);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function isAuthenticated() {
  const username = getAdminUsername();
  const password = getAdminPassword();
  const session = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!username || !password || !session) return false;

  const expected = Buffer.from(createAdminSession(username, password));
  const received = Buffer.from(session);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export function changeAdminPassword(password: string) {
  globalThis.activeAdminPassword = password;
}
