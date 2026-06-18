import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { chatwootEnabled, mirrorIncoming } from "@/lib/integrations/chatwoot";

export const ingestWhatsAppMessage = inngest.createFunction(
  { id: "whatsapp-ingest-message", name: "WhatsApp: ingerir mensagem (auto-lead)", triggers: [{ event: "whatsapp/message.received" }] },
  async ({ event }) => {
    const { number, text, pushName, evolutionMessageId } = event.data as {
      number: string;
      text: string;
      pushName?: string | null;
      evolutionMessageId?: string | null;
    };
    if (!number || !text) return { skipped: "sem número/texto" };

    // idempotência: ignora se a mensagem já foi gravada
    if (evolutionMessageId) {
      const dup = await prismadb.whatsApp_Message.findFirst({
        where: { evolutionMessageId, direction: "IN" },
        select: { id: true },
      });
      if (dup) return { skipped: "duplicada" };
    }

    // dono padrão (primeiro admin ativo)
    const owner = await prismadb.users.findFirst({
      where: { role: "admin", userStatus: "ACTIVE" },
      select: { id: true },
    });
    const ownerId = owner?.id;

    // conversa (uma por número)
    let conv = await prismadb.whatsApp_Conversation.findUnique({ where: { remoteNumber: number } });
    if (!conv) {
      conv = await prismadb.whatsApp_Conversation.create({
        data: { remoteNumber: number, name: pushName || undefined, lastMessageAt: new Date(), unreadCount: 1 },
      });
    } else {
      conv = await prismadb.whatsApp_Conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date(), unreadCount: { increment: 1 }, name: conv.name || pushName || undefined },
      });
    }

    // auto-lead se a conversa ainda não está vinculada
    let leadId = conv.leadId;
    if (!leadId && !conv.contactId) {
      const source = await prismadb.crm_Lead_Sources.upsert({
        where: { name: "WhatsApp" },
        update: {},
        create: { name: "WhatsApp" },
        select: { id: true },
      });
      const lead = await prismadb.crm_Leads.create({
        data: {
          v: 1,
          lastName: pushName || number,
          phone: number,
          lead_source_id: source.id,
          assigned_to: ownerId,
          createdBy: ownerId,
          updatedBy: ownerId,
        },
        select: { id: true },
      });
      leadId = lead.id;
      await prismadb.whatsApp_Conversation.update({ where: { id: conv.id }, data: { leadId } });
      try {
        await writeAuditLog({ entityType: "lead", entityId: lead.id, action: "created", changes: null, userId: ownerId ?? null });
      } catch {}
    }

    // mensagem IN
    await prismadb.whatsApp_Message.create({
      data: {
        conversationId: conv.id,
        direction: "IN",
        type: "text",
        content: text,
        evolutionMessageId: evolutionMessageId || undefined,
        fromMe: false,
        status: "received",
        timestamp: new Date(),
      },
    });

    // espelha no Chatwoot (inbox de agentes/bot) — best-effort, se configurado
    if (chatwootEnabled()) {
      try {
        const { contactSourceId, conversationId } = await mirrorIncoming({
          number,
          name: conv.name || pushName,
          text,
          contactSourceId: conv.chatwoot_contact_id,
          conversationId: conv.chatwoot_conversation_id,
        });
        if (contactSourceId !== conv.chatwoot_contact_id || conversationId !== conv.chatwoot_conversation_id) {
          await prismadb.whatsApp_Conversation.update({
            where: { id: conv.id },
            data: { chatwoot_contact_id: contactSourceId, chatwoot_conversation_id: conversationId },
          });
        }
      } catch (e) {
        console.error("[CHATWOOT_MIRROR]", (e as any)?.message || e);
      }
    }

    // se o BOT estiver ativo para este lead, responde automaticamente (via IA)
    if (leadId) {
      const lead = await prismadb.crm_Leads.findUnique({
        where: { id: leadId },
        select: { bot_status: true },
      });
      if (lead?.bot_status === "active") {
        await inngest.send({
          name: "whatsapp/bot.reply",
          data: { leadId, conversationId: conv.id },
        });
      }
    }

    // atividade na timeline (best-effort)
    const ent = leadId
      ? { entityType: "lead", entityId: leadId }
      : conv.contactId
      ? { entityType: "contact", entityId: conv.contactId }
      : null;
    if (ent) {
      try {
        const a = await prismadb.crm_Activities.create({
          data: {
            type: "note",
            title: "WhatsApp recebido",
            description: text,
            date: new Date(),
            status: "completed",
            createdBy: ownerId,
            metadata: { channel: "whatsapp", number } as any,
          },
          select: { id: true },
        });
        await prismadb.crm_ActivityLinks.create({
          data: { activityId: a.id, entityType: ent.entityType, entityId: ent.entityId },
        });
      } catch {}
    }

    return { conversationId: conv.id, leadId: leadId || null };
  }
);
