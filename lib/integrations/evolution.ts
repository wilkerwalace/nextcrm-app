/**
 * Client da EvolutionGO (WhatsApp). Auth: GLOBAL key para admin (create/list);
 * token PRÓPRIO da instância para operações (connect/qr/status/send).
 * Base interna: http://evolution-go:8080 (rede docker `stack`).
 */
import { randomUUID, randomBytes } from "crypto";

const BASE = process.env.EVOLUTION_API_URL || "http://evolution-go:8080";
const GLOBAL_KEY = process.env.EVOLUTION_API_KEY || "";

type EvoOpts = { method?: string; apikey?: string; body?: any };

async function evo(path: string, { method = "GET", apikey, body }: EvoOpts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      apikey: apikey || GLOBAL_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const txt = await res.text();
  let json: any;
  try {
    json = JSON.parse(txt);
  } catch {
    json = { raw: txt };
  }
  if (!res.ok) throw new Error(json?.error || `EvolutionGO HTTP ${res.status}`);
  return json;
}

/** Cria a instância (admin). Retorna o id (UUID) e o token gerado. */
export async function createInstance(name: string) {
  const instanceId = randomUUID();
  const token = "amzc_" + randomBytes(18).toString("hex");
  const r = await evo("/instance/create", {
    method: "POST",
    apikey: GLOBAL_KEY,
    body: { instanceId, name, token },
  });
  const data = r?.data || {};
  return { evolutionId: data.id || instanceId, token: data.token || token, name };
}

/** Conecta/pareia a instância e DEFINE o webhook + eventos. Dispara o QR. */
export async function connectInstance(
  token: string,
  opts: { phone?: string; webhookUrl: string; subscribe?: string[] }
) {
  const subscribe =
    opts.subscribe ||
    (process.env.WHATSAPP_SUBSCRIBE || "Message,Connected,Disconnected,QR")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return evo("/instance/connect", {
    method: "POST",
    apikey: token,
    body: { phone: opts.phone, webhookUrl: opts.webhookUrl, subscribe, immediate: true },
  });
}

export async function getQr(token: string) {
  return evo("/instance/qr", { apikey: token });
}

export async function getStatus(token: string) {
  return evo("/instance/status", { apikey: token });
}

export async function listInstances() {
  return evo("/instance/all", { apikey: GLOBAL_KEY });
}

/** Envia uma mensagem de texto. `number` = telefone em dígitos com DDI. */
export async function sendText(token: string, number: string, text: string) {
  return evo("/send/text", {
    method: "POST",
    apikey: token,
    body: { number: onlyDigits(number), text },
  });
}

export function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
