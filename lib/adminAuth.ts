import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { databaseQuery } from "@/lib/database";

export const ADMIN_COOKIE_NAME = "arav_admin_session";
const DEFAULT_ADMIN_USERNAME = "aravadmin";
const DEFAULT_ADMIN_PASSWORD = "AravPortfolio-Admin-2026!";

export function getAdminUsername() {
  return process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME;
}

export async function getAdminPassword() {
  const result = await databaseQuery<{ value: string }>(
    "SELECT value FROM portfolio_settings WHERE key = $1",
    ["admin_password"],
  );
  if (result.rows[0]) return result.rows[0].value;

  const initialPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
  await databaseQuery(
    "INSERT INTO portfolio_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
    ["admin_password", initialPassword],
  );
  return initialPassword;
}

export function createAdminSession(username: string, password: string) {
  return createHmac("sha256", password).update(username).digest("hex");
}

export function passwordsMatch(expectedPassword: string, receivedPassword: string) {
  const expected = Buffer.from(expectedPassword);
  const received = Buffer.from(receivedPassword);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function isAuthenticated() {
  const username = getAdminUsername();
  const password = await getAdminPassword();
  const session = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!username || !password || !session) return false;

  const expected = Buffer.from(createAdminSession(username, password));
  const received = Buffer.from(session);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function changeAdminPassword(password: string) {
  await databaseQuery(
    "INSERT INTO portfolio_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    ["admin_password", password],
  );
}
