export type ChatAttachment = {
  kind: "image" | "video" | "audio" | "document" | "gif";
  name: string;
  mime: string;
  size: number;
  data: string;
};

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return typeof window !== "undefined" ? window.btoa(binary) : Buffer.from(binary).toString("base64");
}

function decodeBase64(value: string) {
  const normalized = value.replace(/\s/g, "");
  if (typeof window !== "undefined") {
    const binary = window.atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return Uint8Array.from(Buffer.from(normalized, "base64"));
}

function getStorageKey(conversationId: string) {
  return `arav_chat_key_${conversationId}`;
}

async function getConversationKey(conversationId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKey = getStorageKey(conversationId);
  const saved = window.localStorage.getItem(storageKey);
  if (saved) {
    const raw = decodeBase64(saved);
    return window.crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  }

  const key = window.crypto.getRandomValues(new Uint8Array(32));
  const base64 = encodeBase64(key);
  window.localStorage.setItem(storageKey, base64);
  return window.crypto.subtle.importKey("raw", key, "AES-GCM", true, ["encrypt", "decrypt"]);
}

export async function encryptMessageText(conversationId: string, text: string) {
  if (!conversationId || !text.trim()) return text;
  if (typeof window === "undefined") return text;

  const key = await getConversationKey(conversationId);
  if (!key) return text;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text),
  );

  const payload = new Uint8Array(encrypted);
  return `enc:${encodeBase64(iv)}.${encodeBase64(payload)}`;
}

export async function decryptMessageText(conversationId: string, text: string) {
  if (!text || !text.startsWith("enc:")) return text;
  if (typeof window === "undefined") return text;

  const key = await getConversationKey(conversationId);
  if (!key) return text;

  const [, rawPayload] = text.split(":");
  if (!rawPayload) return text;

  const [ivPart, cipherPart] = rawPayload.split(".");
  if (!ivPart || !cipherPart) return text;

  try {
    const iv = decodeBase64(ivPart);
    const encrypted = decodeBase64(cipherPart);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted,
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return text;
  }
}

export function sanitizeFileAttachment(file: File): Promise<ChatAttachment | null> {
  return new Promise((resolve) => {
    if (!file || file.size > 5 * 1024 * 1024) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const kind = file.type.startsWith("image/gif")
        ? "gif"
        : file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type.startsWith("audio/")
              ? "audio"
              : "document";

      resolve({
        kind,
        name: file.name || "attachment",
        mime: file.type || "application/octet-stream",
        size: file.size,
        data: result,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
