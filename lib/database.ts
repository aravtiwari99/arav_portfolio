import { Pool, QueryResultRow } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  portfolioDatabase?: Pool;
  portfolioDatabaseSchema?: Promise<void>;
};

function getPool() {
  const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL or DATABASE_URL is required for persistent portfolio storage.");
  }

  globalForDatabase.portfolioDatabase ??= new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
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
        visitor_id TEXT,
        visited_at TIMESTAMPTZ NOT NULL,
        public_ip TEXT,
        user_agent TEXT,
        location JSONB
      );

      ALTER TABLE portfolio_visitors ADD COLUMN IF NOT EXISTS visitor_id TEXT;
      UPDATE portfolio_visitors SET visitor_id = id WHERE visitor_id IS NULL;

      DROP TRIGGER IF EXISTS portfolio_visitors_no_delete ON portfolio_visitors;

      CREATE TABLE IF NOT EXISTS portfolio_conversations (
        id TEXT PRIMARY KEY,
        visitor_key TEXT NOT NULL,
        visitor_name TEXT NOT NULL,
        phone TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS portfolio_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES portfolio_conversations(id) ON DELETE CASCADE,
        sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        edited_at TIMESTAMPTZ,
        deleted_for_visitor BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_for_admin BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'seen')),
        reply_to_id TEXT,
        attachment JSONB
      );

      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS deleted_for_visitor BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS deleted_for_admin BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS attachment JSONB;
      ALTER TABLE portfolio_messages ADD COLUMN IF NOT EXISTS reactions JSONB NOT NULL DEFAULT '[]'::jsonb;

      UPDATE portfolio_messages
      SET status = 'sent'
      WHERE status IS NULL OR status NOT IN ('sent', 'delivered', 'seen');

      UPDATE portfolio_messages
      SET reactions = '[]'::jsonb
      WHERE reactions IS NULL;

      CREATE TABLE IF NOT EXISTS portfolio_call_requests (
        id TEXT PRIMARY KEY,
        visitor_key TEXT NOT NULL,
        visitor_name TEXT NOT NULL,
        phone TEXT,
        reason TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'closed'))
      );

      CREATE INDEX IF NOT EXISTS portfolio_messages_conversation_idx
        ON portfolio_messages (conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS portfolio_call_requests_created_idx
        ON portfolio_call_requests (created_at DESC);

      INSERT INTO portfolio_settings (key, value)
      VALUES ('message_retention', 'off')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO portfolio_settings (key, value)
      VALUES ('admin_last_seen_visible', 'true')
      ON CONFLICT (key) DO NOTHING;
    `)
    .then(() => undefined);

  await globalForDatabase.portfolioDatabaseSchema;
}