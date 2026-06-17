/**
 * Wrapper de IA via Dify (app key). Suporta workflow | chat | completion.
 * Config por env: DIFY_API_URL, DIFY_API_KEY, DIFY_MODE, DIFY_INPUT_VAR.
 * Sem chave -> aiEnabled() = false (recursos de IA ficam desligados).
 */
const URL_BASE = process.env.DIFY_API_URL || "https://dify.amzc.tech/v1";
const KEY = process.env.DIFY_API_KEY || "";
const MODE = (process.env.DIFY_MODE || "workflow").toLowerCase();
const INPUT_VAR = process.env.DIFY_INPUT_VAR || "prompt";

export function aiEnabled() {
  return !!KEY;
}

async function difyPost(path: string, body: any) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const txt = await res.text();
  let j: any;
  try {
    j = JSON.parse(txt);
  } catch {
    j = { raw: txt };
  }
  if (!res.ok) throw new Error(j?.message || `Dify HTTP ${res.status}`);
  return j;
}

/** Gera texto a partir de um prompt, usando o app Dify configurado. */
export async function generateText(prompt: string, user = "amzc-crm"): Promise<string> {
  if (!KEY) throw new Error("IA não configurada (defina DIFY_API_KEY).");

  if (MODE === "chat") {
    const r = await difyPost("/chat-messages", { inputs: {}, query: prompt, response_mode: "blocking", user });
    return String(r?.answer ?? "").trim();
  }
  if (MODE === "completion") {
    const r = await difyPost("/completion-messages", {
      inputs: { [INPUT_VAR]: prompt },
      response_mode: "blocking",
      user,
    });
    return String(r?.answer ?? "").trim();
  }
  // workflow (padrão)
  const r = await difyPost("/workflows/run", {
    inputs: { [INPUT_VAR]: prompt },
    response_mode: "blocking",
    user,
  });
  const out = r?.data?.outputs || {};
  const val =
    out.result ?? out.text ?? out.output ?? out.answer ?? out.idea ?? Object.values(out)[0] ?? "";
  return String(val).trim();
}
