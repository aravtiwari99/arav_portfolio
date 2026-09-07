import { Pool, QueryResultRow } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  portfolioDatabase?: Pool;
  portfolioDatabaseSchema?: Promise<void>;
};

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for persistent portfolio storage.");
  }

  globalForDatabase.portfolioDatabase ??= new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
  return globalForDatabase.portfolioDatabase;
}

export async function databaseQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  await ensureDatabaseSchema();
  return getPool().query<T>(text, values);
}

async function ensureDatabaseSchema() {
  globalForDatabase.portfolioDatabaseSchema ??= getPool()
    .query(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS portfolio_visitors (
        id TEXT PRIMARY KEY,
        visited_at TIMESTAMPTZ NOT NULL,
        public_ip TEXT,
        user_agent TEXT,
        location JSONB
      );
    `)
    .then(() => undefined);

  await globalForDatabase.portfolioDatabaseSchema;
}