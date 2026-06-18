import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { generateTenantReply } from "@/lib/agent/tenant-agent";
import { sendText } from "@/lib/integrations/evolution";

/**
 * Mensagem recebida na linha de um CLIENTE (tenant) → o agente do cliente responde.
 * Canal whatsapp: envia a resposta pela instância EvolutionGO dedicada do cliente.
 */
export const tenantAgentMessage = inngest.createFunction(
  { id: "tenant-agent-message", name: "Tenant: agente responde (IA)", triggers: [{ event: "tenant/message.received" }] },
  async ({ event }) => {
    const { tenantId, number, text, pushName, externalId, channel } = event.data as {
      tenantId: string;
      number: string;
      text: string;
      pushName?: string | null;
      externalId?: string | null;
      channel?: string;
    };
    if (!tenantId || !number || !text) return { skipped: "dados incompletos" };

    const ch = channel || "whatsapp";

    // idempotência por externalId
    if (externalId) {
      const dup = await prismadb.tenant_Message.findFirst({
        where: { externalId, direction: "IN" },
        select: { id: true },
      });
      if (dup) return { skipped: "duplicada" };
    }

    // upsert conversa do tenant
    const conv = await prismadb.tenant_Conversation.upsert({
      where: { clientTenantId_remoteNumber: { clientTenantId: tenantId, remoteNumber: number } },
      update: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, name: pushName || undefined },
      create: { clientTenantId: tenantId, remoteNumber: number, channel: ch, name: pushName || undefined, lastMessageAt: new Date(), unreadCount: 1 },
      select: { id: true },
    });

    // loga IN
    await prismadb.tenant_Message.create({
      data: { conversationId: conv.id, direction: "IN", content: text, externalId: externalId || undefined, status: "received", timestamp: new Date() },
    });

    // gera resposta do agente (+ agendamento se confirmado)
    const res = await generateTenantReply(tenantId, conv.id);
    if (!res.reply) return { skipped: res.skipped || res.error || "sem resposta" };

    // entrega pelo WhatsApp do cliente
    if (ch === "whatsapp") {
      const tenant = await prismadb.client_Tenant.findUnique({
        where: { id: tenantId },
        select: { whatsapp_instance_id: true },
      });
      if (tenant?.whatsapp_instance_id) {
        const inst = await prismadb.whatsApp_Instance.findUnique({ where: { id: tenant.whatsapp_instance_id } });
        if (inst?.token) {
          try {
            await sendText(inst.token, number, res.reply);
          } catch (e: any) {
            console.error("[TENANT_AGENT] envio WhatsApp falhou:", e?.message || e);
          }
        }
      }
    }

    return { replied: true, scheduled: res.scheduled, handoff: res.handoff };
  }
);
