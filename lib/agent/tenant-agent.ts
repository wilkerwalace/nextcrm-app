/**
 * Cérebro do agente de IA de um cliente (tenant). Gera a resposta a partir da
 * persona + histórico + disponibilidade, e AGENDA quando o cliente confirma um
 * horário (ferramenta de agendamento via tag [AGENDAR]).
 * Reutilizado pelos canais WhatsApp (inngest) e Widget (endpoint público).
 */
import { prismadb } from "@/lib/prisma";
import { generateText, aiEnabled } from "@/lib/integrations/ai";

const WD = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function availabilitySummary(avail: { weekday: number; start_time: string; end_time: string }[]) {
  if (!avail?.length) return "Sem disponibilidade cadastrada.";
  return avail
    .slice()
    .sort((a, b) => a.weekday - b.weekday)
    .map((a) => `${WD[a.weekday]}: ${a.start_time}-${a.end_time}`)
    .join("; ");
}

/**
 * Gera a próxima resposta do agente para a conversa, registra a mensagem OUT,
 * e cria um agendamento se o cliente confirmar um horário.
 * Retorna { reply, handoff, scheduled }.
 */
export async function generateTenantReply(tenantId: string, conversationId: string) {
  if (!aiEnabled()) return { reply: "", handoff: false, scheduled: false, skipped: "IA desligada" };

  const tenant = await prismadb.client_Tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    include: { availability: true },
  });
  if (!tenant) return { reply: "", handoff: false, scheduled: false, skipped: "tenant" };
  if (!tenant.agent_enabled || tenant.status !== "active")
    return { reply: "", handoff: false, scheduled: false, skipped: "agente off" };

  const conv = await prismadb.tenant_Conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return { reply: "", handoff: false, scheduled: false, skipped: "conv" };
  if (conv.agent_paused) return { reply: "", handoff: true, scheduled: false, skipped: "pausado (humano)" };

  const msgs = await prismadb.tenant_Message.findMany({
    where: { conversationId },
    orderBy: { timestamp: "desc" },
    take: 14,
    select: { direction: true, content: true },
  });
  const transcript = msgs
    .reverse()
    .map((m) => `${m.direction === "IN" ? "Cliente" : "Você"}: ${m.content}`)
    .join("\n");

  const agora = new Date();
  const dataHoje = agora.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const prompt = [
    `Você é ${tenant.agent_name || "o assistente"}, atendente virtual de "${tenant.name}". Responda SEMPRE em português do Brasil, em no máximo 3 frases, tom humano e prestativo.`,
    tenant.agent_persona ? `\nInstruções do negócio:\n${tenant.agent_persona}` : "",
    `\nData/hora atual: ${dataHoje} (America/Sao_Paulo).`,
    `Disponibilidade para agendamento: ${availabilitySummary(tenant.availability as any)}.`,
    ``,
    `FERRAMENTA DE AGENDAMENTO: quando (e só quando) o cliente CONFIRMAR um horário específico dentro da disponibilidade, finalize sua resposta com uma última linha EXATAMENTE no formato:`,
    `[AGENDAR]|<ISO8601 com fuso -03:00>|<nome do cliente ou vazio>|<telefone ou vazio>`,
    `Exemplo: [AGENDAR]|2026-06-20T15:00:00-03:00|Maria|5511999998888`,
    `Não invente horários fora da disponibilidade. Se o cliente pedir falar com uma pessoa, finalize com a linha [HANDOFF].`,
    ``,
    `Conversa até agora:`,
    transcript,
    ``,
    `Escreva APENAS a sua próxima resposta ao cliente (a linha [AGENDAR]/[HANDOFF], se houver, é a última linha e NÃO será mostrada ao cliente).`,
  ]
    .filter(Boolean)
    .join("\n");

  let raw = "";
  try {
    raw = await generateText(prompt);
  } catch (e: any) {
    return { reply: "", handoff: false, scheduled: false, error: e?.message || "IA falhou" };
  }
  if (!raw) return { reply: "", handoff: false, scheduled: false, skipped: "vazio" };

  const handoff = /\[HANDOFF\]/i.test(raw);
  let scheduled = false;

  // extrai a tag de agendamento (se houver) da última linha
  const schedMatch = raw.match(/\[AGENDAR\]\|([^|]*)\|([^|]*)\|([^\n]*)/i);
  if (schedMatch) {
    const iso = schedMatch[1].trim();
    const when = new Date(iso);
    if (!isNaN(when.getTime())) {
      try {
        await prismadb.appointment.create({
          data: {
            clientTenantId: tenant.id,
            scheduled_at: when,
            customer_name: (schedMatch[2] || "").trim() || conv.name || null,
            customer_phone: (schedMatch[3] || "").trim() || (conv.channel === "whatsapp" ? conv.remoteNumber : null),
            source: conv.channel,
            status: "scheduled",
            confirmation_sent: true, // o agente já confirma na própria resposta
          },
        });
        scheduled = true;
      } catch (e) {
        console.error("[TENANT_AGENT] falha ao agendar:", (e as any)?.message || e);
      }
    }
  }

  // limpa as tags do texto mostrado ao cliente
  const reply = raw
    .replace(/\[AGENDAR\]\|[^\n]*/gi, "")
    .replace(/\[HANDOFF\]/gi, "")
    .trim();

  const finalReply = reply || (handoff ? "Vou te encaminhar para um atendente, um momento." : "");
  if (!finalReply) return { reply: "", handoff, scheduled, skipped: "sem texto" };

  await prismadb.tenant_Message.create({
    data: { conversationId, direction: "OUT", content: finalReply, status: "sent", timestamp: new Date() },
  });

  return { reply: finalReply, handoff, scheduled };
}
