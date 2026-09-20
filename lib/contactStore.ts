import { randomUUID } from "crypto";
import { databaseQuery } from "@/lib/database";

export type Retention = "off" | "24h" | "7d" | "30d";

export type MessageStatus = "sent" | "delivered" | "seen";

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "visitor" | "admin";
  body: string;
  createdAt: string;
  editedAt?: string;
  deleted?: boolean;
  status?: MessageStatus;
  replyToId?: string | null;
  attachment?: unknown;
  reactions?: string[];
}

export interface Conversation {
  id: string;
  visitorKey: string;
  visitorName: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

function retentionExpiry(retention: Retention) {
  if (retention === "off") return null;
  const hours = retention === "24h" ? 24 : retention === "7d" ? 168 : 720;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export async function getRetention(): Promise<Retention> {
  const result = await databaseQuery<{ value: Retention }>(
    "SELECT value FROM portfolio_settings WHERE key = $1",
    ["message_retention"],
  );
  return result.rows[0]?.value || "off";
}

export async function setRetention(retention: Retention) {
  await databaseQuery(
    `INSERT INTO portfolio_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    ["message_retention", retention],
  );
}

export async function createConversation(visitorKey: string, name: string, phone?: string) {
  const id = randomUUID();
  await databaseQuery(
    `INSERT INTO portfolio_conversations (id, visitor_key, visitor_name, phone)
     VALUES ($1, $2, $3, $4)`,
    [id, visitorKey, name, phone || null],
  );
  return id;
}

export async function addMessage(
  conversationId: string,
  sender: "visitor" | "admin",
  body: string,
  options?: {
    status?: MessageStatus;
    replyToId?: string | null;
    attachment?: unknown;
    reactions?: string[];
    expiresInSeconds?: number;
  },
) {
  const messageId = randomUUID();
  const expiry = await getRetention();
  const messageExpiry = options?.expiresInSeconds
    ? new Date(Date.now() + options.expiresInSeconds * 1000).toISOString()
    : retentionExpiry(expiry);
  await databaseQuery(
    `INSERT INTO portfolio_messages (id, conversation_id, sender, body, expires_at, status, reply_to_id, attachment, reactions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      messageId,
      conversationId,
      sender,
      body,
      messageExpiry,
      options?.status ?? "sent",
      options?.replyToId ?? null,
      options?.attachment ? JSON.stringify(options.attachment) : null,
      JSON.stringify(options?.reactions ?? []),
    ],
  );
  await databaseQuery("UPDATE portfolio_conversations SET updated_at = NOW() WHERE id = $1", [conversationId]);
  return messageId;
}

export async function clearVisitorMessages(conversationId: string, visitorKey: string, everyone: boolean) {
  const result = await databaseQuery<{ id: string }>(
    "SELECT id FROM portfolio_conversations WHERE id = $1 AND visitor_key = $2",
    [conversationId, visitorKey],
  );
  if (!result.rows[0]) return false;
  await databaseQuery(
    everyone
      ? "UPDATE portfolio_messages SET deleted_for_everyone = TRUE WHERE conversation_id = $1"
      : "UPDATE portfolio_messages SET deleted_for_visitor = TRUE WHERE conversation_id = $1",
    [conversationId],
  );
  return true;
}

export async function deleteVisitorConversation(conversationId: string, visitorKey: string) {
  const result = await databaseQuery(
    "DELETE FROM portfolio_conversations WHERE id = $1 AND visitor_key = $2",
    [conversationId, visitorKey],
  );
  return result.rowCount === 1;
}

export async function getConversation(conversationId: string) {
  const result = await databaseQuery<ChatMessage>(
    `SELECT id, conversation_id AS "conversationId", sender,
            CASE WHEN deleted_for_everyone OR deleted_for_visitor THEN '[Message deleted]' ELSE body END AS body,
            created_at AS "createdAt", edited_at AS "editedAt",
            (deleted_for_everyone OR deleted_for_visitor) AS deleted,
            status, reply_to_id AS "replyToId", attachment, reactions
     FROM portfolio_messages
     WHERE conversation_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY created_at ASC`,
    [conversationId],
  );
  return result.rows;
}

export async function conversationExists(conversationId: string) {
  const result = await databaseQuery<{ exists: boolean }>(
    "SELECT EXISTS (SELECT 1 FROM portfolio_conversations WHERE id = $1) AS exists",
    [conversationId],
  );
  return result.rows[0]?.exists === true;
}

export async function getInbox() {
  const result = await databaseQuery<Conversation>(
    `SELECT c.id, c.visitor_key AS "visitorKey", c.visitor_name AS "visitorName", c.phone,
            c.created_at AS "createdAt", c.updated_at AS "updatedAt",
            COALESCE(json_agg(json_build_object(
              'id', m.id, 'conversationId', m.conversation_id, 'sender', m.sender,
              'body', CASE WHEN m.deleted_for_everyone OR m.deleted_for_admin THEN '[Message deleted]' ELSE m.body END,
              'createdAt', m.created_at, 'editedAt', m.edited_at,
              'deleted', (m.deleted_for_everyone OR m.deleted_for_admin),
              'status', m.status,
              'replyToId', m.reply_to_id,
              'attachment', m.attachment,
              'reactions', COALESCE(m.reactions, '[]'::jsonb)
            ) ORDER BY m.created_at ASC) FILTER (WHERE m.id IS NOT NULL), '[]') AS messages
     FROM portfolio_conversations c
     LEFT JOIN portfolio_messages m ON m.conversation_id = c.id
       AND (m.expires_at IS NULL OR m.expires_at > NOW())
     GROUP BY c.id ORDER BY c.updated_at DESC`,
  );
  return result.rows;
}

function withinEditWindow(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() <= 60 * 60 * 1000;
}

export async function updateVisitorMessage(
  messageId: string,
  conversationId: string,
  visitorKey: string,
  action: "edit" | "delete-me" | "delete-everyone",
  body?: string,
) {
  const result = await databaseQuery<{ createdAt: string; sender: "visitor" | "admin" }>(
    `SELECT m.created_at AS "createdAt", m.sender FROM portfolio_messages m
     JOIN portfolio_conversations c ON c.id = m.conversation_id
     WHERE m.id = $1 AND m.conversation_id = $2 AND c.visitor_key = $3`,
    [messageId, conversationId, visitorKey],
  );
  const message = result.rows[0];
  if (!message || message.sender !== "visitor" || !withinEditWindow(message.createdAt)) return false;
  if (action === "edit") {
    if (!body?.trim() || body.trim().length > 2000) return false;
    await databaseQuery("UPDATE portfolio_messages SET body = $2, edited_at = NOW() WHERE id = $1", [messageId, body.trim()]);
  } else if (action === "delete-me") {
    await databaseQuery("UPDATE portfolio_messages SET deleted_for_visitor = TRUE WHERE id = $1", [messageId]);
  } else {
    await databaseQuery("UPDATE portfolio_messages SET deleted_for_everyone = TRUE WHERE id = $1", [messageId]);
  }
  return true;
}

export async function updateAdminMessage(
  messageId: string,
  action: "edit" | "delete-me" | "delete-everyone",
  body?: string,
) {
  const result = await databaseQuery<{ createdAt: string; sender: "visitor" | "admin" }>(
    `SELECT created_at AS "createdAt", sender FROM portfolio_messages WHERE id = $1`,
    [messageId],
  );
  const message = result.rows[0];
  if (!message || message.sender !== "admin" || !withinEditWindow(message.createdAt)) return false;
  if (action === "edit") {
    if (!body?.trim() || body.trim().length > 2000) return false;
    await databaseQuery("UPDATE portfolio_messages SET body = $2, edited_at = NOW() WHERE id = $1", [messageId, body.trim()]);
  } else if (action === "delete-me") {
    await databaseQuery("UPDATE portfolio_messages SET deleted_for_admin = TRUE WHERE id = $1", [messageId]);
  } else {
    await databaseQuery("UPDATE portfolio_messages SET deleted_for_everyone = TRUE WHERE id = $1", [messageId]);
  }
  return true;
}

export async function updateMessageStatus(messageId: string, status: MessageStatus) {
  await databaseQuery(
    "UPDATE portfolio_messages SET status = $2 WHERE id = $1",
    [messageId, status],
  );
}

export async function toggleMessageReaction(messageId: string, conversationId: string, emoji: string) {
  const result = await databaseQuery<{ reactions: string[] | null }>(
    `SELECT reactions FROM portfolio_messages WHERE id = $1 AND conversation_id = $2`,
    [messageId, conversationId],
  );
  const message = result.rows[0];
  if (!message) return [];
  const current = Array.isArray(message.reactions) ? message.reactions : [];
  const next = current.includes(emoji)
    ? current.filter((item) => item !== emoji)
    : [...current, emoji];
  await databaseQuery(
    "UPDATE portfolio_messages SET reactions = $2 WHERE id = $1",
    [messageId, JSON.stringify(next)],
  );
  return next;
}

export async function getAdminPresence() {
  const result = await databaseQuery<{ key: string; value: string }>(
    "SELECT key, value FROM portfolio_settings WHERE key IN ('admin_last_seen', 'admin_last_seen_visible')",
  );
  const values = Object.fromEntries(result.rows.map((row) => [row.key, row.value]));
  return { lastSeen: values.admin_last_seen || null, visible: values.admin_last_seen_visible !== "false" };
}

export async function markConversationSeen(conversationId: string) {
  await databaseQuery(
    `UPDATE portfolio_messages
     SET status = 'seen'
     WHERE conversation_id = $1 AND sender = 'visitor' AND status != 'seen'`,
    [conversationId],
  );
}

export async function markAllVisitorMessagesSeen() {
  await databaseQuery(
    `UPDATE portfolio_messages
     SET status = 'seen'
     WHERE sender = 'visitor' AND status != 'seen'`,
  );
}

export async function touchAdminPresence() {
  await databaseQuery(
    `INSERT INTO portfolio_settings (key, value) VALUES ('admin_last_seen', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [new Date().toISOString()],
  );
}

export async function setAdminPresenceVisible(visible: boolean) {
  await databaseQuery(
    `INSERT INTO portfolio_settings (key, value) VALUES ('admin_last_seen_visible', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(visible)],
  );
}

export async function addCallRequest(visitorKey: string, name: string, phone: string | undefined, reason: string) {
  await databaseQuery(
    `INSERT INTO portfolio_call_requests (id, visitor_key, visitor_name, phone, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [randomUUID(), visitorKey, name, phone || null, reason],
  );
}

export async function getCallRequests() {
  const result = await databaseQuery(
    `SELECT id, visitor_key AS "visitorKey", visitor_name AS "visitorName", phone, reason,
            created_at AS "createdAt", status
     FROM portfolio_call_requests ORDER BY created_at DESC`,
  );
  return result.rows;
}

export async function updateCallStatus(id: string, status: "pending" | "contacted" | "closed") {
  await databaseQuery("UPDATE portfolio_call_requests SET status = $2 WHERE id = $1", [id, status]);
}

export async function deleteConversation(conversationId: string) {
  await databaseQuery("DELETE FROM portfolio_conversations WHERE id = $1", [conversationId]);
}

export async function deleteCallRequest(id: string) {
  await databaseQuery("DELETE FROM portfolio_call_requests WHERE id = $1", [id]);
}