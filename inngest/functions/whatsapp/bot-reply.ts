import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { generateText, aiEnabled } from "@/lib/integrations/ai";
import { chatwootAgentEnabled, postOutgoing } from "@/lib/integrations/chatwoot";
import { sendWhatsAppCore } from "@/actions/whatsapp/send-message";

/**
 * Responde automaticamente quando o BOT está ativo para o lead.
 * A resposta é postada no Chatwoot como SAÍDA → a ponte Chatwoot→WhatsApp
 * entrega ao cliente (sem envio duplicado). Se não houver conversa no Chatwoot,
 * cai para envio direto pelo WhatsApp.
 */
export const whatsappBotReply = inngest.createFunction(
  { id: "whatsapp-bot-reply", name: "WhatsApp: bot responde (IA)", triggers: [{ event: "whatsapp/bot.reply" }] },
  async ({ event }) => {
    const { leadId, conversationId } = event.data as { leadId: string; conversationId: string };
    if (!leadId || !conversationId) return { skipped: "sem leadId/conversationId" };
    if (!aiEnabled()) return { skipped: "IA desligada" };

    const lead = await prismadb.crm_Leads.findFirst({
      where: { id: leadId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        phone: true,
        recommendations: true,
        preview_url: true,
        bot_status: true,
      },
    });
    if (!lead) return { skipped: "lead não encontrado" };
    if (lead.bot_status !== "active") return { skipped: `bot ${lead.bot_status}` };

    const conv = await prismadb.whatsApp_Conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, remoteNumber: true, chatwoot_conversation_id: true, name: true },
    });
    if (!conv) return { skipped: "conversa não encontrada" };

    // histórico recente para contexto
    const msgs = await prismadb.whatsApp_Message.findMany({
      where: { conversationId: conv.id },
      orderBy: { timestamp: "desc" },
      take: 12,
      select: { direction: true, content: true },
    });
    const transcript = msgs
      .reverse()
      .map((m) => `${m.direction === "IN" ? "Cliente" : "Você"}: ${m.content}`)
      .join("\n");

    const nome = lead.company || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "o cliente";
    const prompt = [
      `Você é um assistente comercial (SDR) cordial e objetivo da nossa agência de criação de sites, conversando por WhatsApp com ${nome}. Responda SEMPRE em português do Brasil, em no máximo 3 frases curtas, tom humano e prestativo. Objetivo: apresentar/explicar a proposta de site/landing, tirar dúvidas e, se fizer sentido, sugerir um horário para conversar.`,
      lead.preview_url ? `Link da prévia que você pode compartilhar: ${lead.preview_url}` : ``,
      lead.recommendations ? `\nContexto interno (NÃO copie literalmente):\n${lead.recommendations.slice(0, 1000)}` : ``,
      ``,
      `Se o cliente pedir falar com uma pessoa, recusar claramente, demonstrar irritação, ou pedir algo fora do seu escopo (jurídico, financeiro complexo), encerre sua resposta com a tag [HANDOFF] em uma nova linha.`,
      ``,
      `Conversa até agora:`,
      transcript,
      ``,
      `Escreva APENAS a sua próxima resposta ao cliente (sem prefixos como "Você:").`,
    ]
      .filter(Boolean)
      .join("\n");

    let reply = "";
    try {
      reply = await generateText(prompt);
    } catch (e: any) {
      console.error("[BOT_REPLY] IA falhou:", e?.message || e);
      return { error: "IA falhou" };
    }
    if (!reply) return { skipped: "IA vazia" };

    const handoff = /\[HANDOFF\]/i.test(reply);
    reply = reply.replace(/\[HANDOFF\]/gi, "").trim();
    if (!reply) reply = "Vou te encaminhar para um de nossos especialistas, tudo bem?";

    // entrega: prefere postar no Chatwoot (a ponte envia ao WhatsApp); senão, WhatsApp direto
    const cwId = conv.chatwoot_conversation_id;
    try {
      if (cwId && chatwootAgentEnabled()) {
        await postOutgoing(cwId, reply);
      } else {
        const owner = await prismadb.users.findFirst({
          where: { role: "admin", userStatus: "ACTIVE" },
          select: { id: true },
        });
        await sendWhatsAppCore(owner?.id || "system", {
          number: conv.remoteNumber,
          text: reply,
          leadId: lead.id,
          name: conv.name || undefined,
        });
      }
    } catch (e: any) {
      console.error("[BOT_REPLY] envio falhou:", e?.message || e);
      return { error: "envio falhou" };
    }

    if (handoff) {
      await prismadb.crm_Leads.update({ where: { id: lead.id }, data: { bot_status: "handoff" } });
      try {
        if (cwId && chatwootAgentEnabled()) {
          await postOutgoing(cwId, "🤖 O bot solicitou transferência para um humano.", { privateNote: true });
        }
      } catch {}
    }

    return { replied: true, handoff };
  }
);
