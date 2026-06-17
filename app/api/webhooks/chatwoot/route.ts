import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { verifyWebhookSignature, extractNumberFromWebhook } from "@/lib/integrations/chatwoot";
import { sendWhatsAppCore } from "@/actions/whatsapp/send-message";

export const dynamic = "force-dynamic";

/** message_type pode vir como número (0/1/2) ou string ("incoming"/"outgoing"). */
function isOutgoing(mt: any): boolean {
  return mt === 1 || mt === "outgoing" || mt === "1";
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const ts = req.headers.get("x-chatwoot-timestamp");
  const sig = req.headers.get("x-chatwoot-signature");

  // valida a assinatura HMAC do Chatwoot (sha256=HMAC(secret, "{ts}.{body}"))
  if (!verifyWebhookSignature(ts, raw, sig)) {
    console.warn("[CHATWOOT_WEBHOOK] assinatura inválida");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: any = {};
  try {
    payload = JSON.parse(raw);
  } catch {
    /* corpo não-JSON */
  }

  try {
    console.log("[CHATWOOT_WEBHOOK]", String(payload?.event), JSON.stringify(payload).slice(0, 1200));
  } catch {}

  const event = payload?.event;

  // SAÍDA: agente/bot respondeu no Chatwoot -> envia pelo WhatsApp via EvolutionGO
  if (event === "message_created" && isOutgoing(payload?.message_type) && !payload?.private) {
    const content = (payload?.content || "").trim();
    const cwConversationId =
      payload?.conversation?.id != null ? String(payload.conversation.id) : null;
    const number = extractNumberFromWebhook(payload);

    if (content && (number || cwConversationId)) {
      // localiza a conversa local (por número ou pelo id do Chatwoot)
      const conv = await prismadb.whatsApp_Conversation.findFirst({
        where: number
          ? { remoteNumber: number }
          : { chatwoot_conversation_id: cwConversationId as string },
        select: { id: true, remoteNumber: true, leadId: true, contactId: true, name: true },
      });
      const targetNumber = conv?.remoteNumber || number;

      if (targetNumber) {
        // dedupe: ignora se mensagem idêntica saiu nos últimos 60s
        if (conv) {
          const recent = await prismadb.whatsApp_Message.findFirst({
            where: {
              conversationId: conv.id,
              direction: "OUT",
              content,
              timestamp: { gte: new Date(Date.now() - 60_000) },
            },
            select: { id: true },
          });
          if (recent) return NextResponse.json({ ok: true, skipped: "duplicada" });
        }

        // usuário de sistema (primeiro admin) para registrar a atividade
        const owner = await prismadb.users.findFirst({
          where: { role: "admin", userStatus: "ACTIVE" },
          select: { id: true },
        });

        const res = await sendWhatsAppCore(owner?.id || "system", {
          number: targetNumber,
          text: content,
          leadId: conv?.leadId || undefined,
          contactId: conv?.contactId || undefined,
          name: conv?.name || undefined,
        });
        if ((res as any).error) {
          console.error("[CHATWOOT_WEBHOOK] falha ao enviar WhatsApp:", (res as any).error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
