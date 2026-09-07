import { databaseQuery } from "@/lib/database";

export interface VisitorLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  recordedAt: string;
  source: "browser" | "ip";
  city?: string;
  region?: string;
  country?: string;
}

export interface VisitorRecord {
  id: string;
  visitedAt: string;
  publicIp?: string;
  userAgent?: string;
  location?: VisitorLocation;
}

export async function recordVisit(id: string, metadata?: Pick<VisitorRecord, "publicIp" | "userAgent">) {
  const result = await databaseQuery<VisitorRecord>(
    `INSERT INTO portfolio_visitors (id, visited_at, public_ip, user_agent)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET public_ip = COALESCE(portfolio_visitors.public_ip, EXCLUDED.public_ip), user_agent = COALESCE(portfolio_visitors.user_agent, EXCLUDED.user_agent)
     RETURNING id, visited_at AS "visitedAt", public_ip AS "publicIp", user_agent AS "userAgent", location`,
    [id, new Date().toISOString(), metadata?.publicIp ?? null, metadata?.userAgent ?? null],
  );
  return result.rows[0];
}

export async function saveVisitorLocation(id: string, location: VisitorLocation) {
  const result = await databaseQuery(
    "UPDATE portfolio_visitors SET location = $2 WHERE id = $1",
    [id, JSON.stringify(location)],
  );
  return result.rowCount === 1;
}

export async function getVisitorHistory() {
  const result = await databaseQuery<VisitorRecord>(
    `SELECT id, visited_at AS "visitedAt", public_ip AS "publicIp", user_agent AS "userAgent", location
     FROM portfolio_visitors ORDER BY visited_at DESC`,
  );
  return result.rows;
}
