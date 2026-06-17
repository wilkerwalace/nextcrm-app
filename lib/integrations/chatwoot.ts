/**
 * Integração com o Chatwoot via API pública (Client API) do canal API.
 * Usa o `inbox_identifier` — NÃO precisa de access token de agente para
 * espelhar mensagens de ENTRADA no inbox. O sentido de SAÍDA chega pelo
 * webhook do Chatwoot (assinado com `X-Chatwoot-Signature`).
 *
 * Env (nextcrm.env, 600):
 *   CHATWOOT_URL                ex.: https://chat.amzc.tech
 *   CHATWOOT_INBOX_IDENTIFIER   token do inbox API (público)
 *   CHATWOOT_IDENTITY_HMAC_KEY  hmac_token (validação de identidade do contato)
 *   CHATWOOT_WEBHOOK_SECRET     secret do inbox (assina o webhook de saída)
 */
import { createHmac, timingSafeEqual } from "crypto";

const URL_BASE = (process.env.CHATWOOT_URL || "").replace(/\/$/, "");
const INBOX = process.env.CHATWOOT_INBOX_IDENTIFIER || "";
const IDENTITY_KEY = process.env.CHATWOOT_IDENTITY_HMAC_KEY || "";
const WEBHOOK_SECRET = process.env.CHATWOOT_WEBHOOK_SECRET || "";

export function chatwootEnabled() {
  return !!(URL_BASE && INBOX);
}

/** Hash de identidade do contato (HMAC-SHA256 do identifier). */
export function identifierHash(identifier: string): string | undefined {
  if (!IDENTITY_KEY) return undefined;
  return createHmac("sha256", IDENTITY_KEY).update(identifier).digest("hex");
}

/** Valida a assinatura do webhook do Chatwoot: sha256=HMAC(secret, "{ts}.{body}"). */
export function verifyWebhookSignature(ts: string | null, rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return false;
  if (!signature) return false;
  const expected = "sha256=" + createHmac("sha256", WEBHOOK_SECRET).update(`${ts ?? ""}.${rawBody}`).digest("hex");
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function pub(path: string, init?: { method?: string; body?: any }) {
  const res = await fetch(`${URL_BASE}/public/api/v1/inboxes/${INBOX}${path}`, {
    method: init?.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const txt = await res.text();
  let j: any;
  try {
    j = JSON.parse(txt);
  } catch {
    j = { raw: txt };
  }
  if (!res.ok) throw new Error(j?.message || j?.error || `Chatwoot HTTP ${res.status}`);
  return j;
}

/** Cria (ou recupera) o contato no inbox e retorna o source_id (identificador do contato). */
export async function ensureContact(identifier: string, name?: string | null): Promise<string> {
  const body: any = { identifier, name: name || identifier };
  const hash = identifierHash(identifier);
  if (hash) body.identifier_hash = hash;
  const j = await pub(`/contacts`, { method: "POST", body });
  const sourceId = j?.source_id || j?.contact?.source_id || j?.id || j?.payload?.source_id;
  if (!sourceId) throw new Error("Chatwoot: source_id ausente na criação do contato");
  return String(sourceId);
}

/** Cria uma conversa para o contato e retorna o id. */
export async function createConversation(sourceId: string): Promise<string> {
  const j = await pub(`/contacts/${sourceId}/conversations`, { method: "POST", body: {} });
  const id = j?.id || j?.payload?.id;
  if (!id) throw new Error("Chatwoot: id de conversa ausente");
  return String(id);
}

/** Posta uma mensagem de ENTRADA (como o contato) na conversa. */
export async function postIncoming(sourceId: string, conversationId: string, content: string) {
  return pub(`/contacts/${sourceId}/conversations/${conversationId}/messages`, {
    method: "POST",
    body: { content },
  });
}

/**
 * Espelha uma mensagem de entrada do WhatsApp no Chatwoot, reaproveitando os
 * ids já gravados na conversa. Retorna os ids (possivelmente novos).
 */
export async function mirrorIncoming(params: {
  number: string;
  name?: string | null;
  text: string;
  contactSourceId?: string | null;
  conversationId?: string | null;
}): Promise<{ contactSourceId: string; conversationId: string }> {
  const contactSourceId = params.contactSourceId || (await ensureContact(params.number, params.name));
  const conversationId = params.conversationId || (await createConversation(contactSourceId));
  await postIncoming(contactSourceId, conversationId, params.text);
  return { contactSourceId, conversationId };
}

/** Extrai o telefone (dígitos) do payload do webhook do Chatwoot. */
export function extractNumberFromWebhook(payload: any): string | null {
  const sender = payload?.conversation?.meta?.sender || payload?.sender || {};
  const cand =
    sender.identifier ||
    sender.phone_number ||
    payload?.conversation?.contact_inbox?.source_id ||
    null;
  if (!cand) return null;
  return String(cand).replace(/\D/g, "") || null;
}
