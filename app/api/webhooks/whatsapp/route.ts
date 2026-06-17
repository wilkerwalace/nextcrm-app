import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export const dynamic = "force-dynamic";

/** Extrai (de forma tolerante) número/texto/fromMe de formatos comuns de evento. */
function parseMessage(payload: any): {
  number: string | null;
  text: string | null;
  fromMe: boolean;
  pushName: string | null;
  evoId: string | null;
} | null {
  const d = payload?.data ?? payload ?? {};
  // JID do remetente em vários formatos
  const jid =
    d?.key?.remoteJid ||
    d?.Info?.Sender ||
    d?.info?.sender ||
    d?.remoteJid ||
    d?.sender ||
    d?.chatId ||
    payload?.sender ||
    null;
  const number = jid ? String(jid).replace(/[@:].*$/, "").replace(/\D/g, "") : null;

  const text =
    d?.message?.conversation ||
    d?.message?.extendedTextMessage?.text ||
    d?.Message?.conversation ||
    d?.Message?.extendedTextMessage?.text ||
    d?.text ||
    d?.body ||
    d?.conversation ||
    null;

  const fromMe = !!(d?.key?.fromMe ?? d?.Info?.IsFromMe ?? d?.fromMe ?? false);
  const pushName = d?.pushName || d?.Info?.PushName || d?.notifyName || d?.name || null;
  const evoId = d?.key?.id || d?.Info?.ID || d?.id || null;

  if (!number && !text) return null;
  return { number, text, fromMe, pushName, evoId };
}

export async function POST(req: NextRequest) {
  // auth simples por segredo na query (EvolutionGO posta numa URL fixa)
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.WHATSAPP_WEBHOOK_SECRET || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    /* corpo não-JSON */
  }

  // log do payload bruto (para calibrar o parser com o formato real da EvolutionGO)
  try {
    console.log("[WHATSAPP_WEBHOOK]", JSON.stringify(payload).slice(0, 1500));
  } catch {}

  const msg = parseMessage(payload);
  // só processa mensagens de ENTRADA (não enviadas por nós) e com número
  if (msg && msg.number && !msg.fromMe && msg.text) {
    await inngest.send({
      name: "whatsapp/message.received",
      data: {
        number: msg.number,
        text: msg.text,
        pushName: msg.pushName,
        evolutionMessageId: msg.evoId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
