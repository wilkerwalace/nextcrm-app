"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendText, onlyDigits } from "@/lib/integrations/evolution";

const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "amzc";

type SendInput = {
  number: string;
  text: string;
  leadId?: string;
  contactId?: string;
  name?: string;
};

/** Núcleo do envio (recebe userId explícito; reutilizado pela action e pelo MCP). */
export async function sendWhatsAppCore(userId: string, input: SendInput) {
  const number = onlyDigits(input.number);
  const text = (input.text || "").trim();
  if (!number) return { error: "Número inválido" };
  if (!text) return { error: "Mensagem vazia" };

  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { instanceName: INSTANCE_NAME } });
  if (!inst?.token) return { error: "WhatsApp não conectado. Conecte em Administração → WhatsApp." };

  try {
    const r = await sendText(inst.token, number, text);
    const evoId = r?.data?.id || r?.data?.key?.id || r?.id || null;

    const conv = await prismadb.whatsApp_Conversation.upsert({
      where: { remoteNumber: number },
      update: {
        lastMessageAt: new Date(),
        ...(input.leadId ? { leadId: input.leadId } : {}),
        ...(input.contactId ? { contactId: input.contactId } : {}),
        ...(input.name ? { name: input.name } : {}),
      },
      create: {
        remoteNumber: number,
        name: input.name,
        leadId: input.leadId,
        contactId: input.contactId,
        lastMessageAt: new Date(),
      },
      select: { id: true },
    });
    await prismadb.whatsApp_Message.create({
      data: {
        conversationId: conv.id,
        direction: "OUT",
        type: "text",
        content: text,
        evolutionMessageId: evoId,
        status: "sent",
        fromMe: true,
        timestamp: new Date(),
      },
    });

    const links: Array<{ entityType: string; entityId: string }> = [];
    if (input.leadId) links.push({ entityType: "lead", entityId: input.leadId });
    if (input.contactId) links.push({ entityType: "contact", entityId: input.contactId });
    if (links.length) {
      try {
        const activity = await prismadb.crm_Activities.create({
          data: {
            type: "note",
            title: "WhatsApp enviado",
            description: text,
            date: new Date(),
            status: "completed",
            createdBy: userId,
            metadata: { channel: "whatsapp", number, evolutionMessageId: evoId } as any,
          },
          select: { id: true },
        });
        await prismadb.crm_ActivityLinks.createMany({
          data: links.map((l) => ({ activityId: activity.id, entityType: l.entityType, entityId: l.entityId })),
          skipDuplicates: true,
        });
      } catch {}
    }
    return { data: { ok: true, conversationId: conv.id } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao enviar WhatsApp" };
  }
}

/** Action (UI): usa a sessão. */
export const sendWhatsApp = async (input: SendInput) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const res = await sendWhatsAppCore((session.user as any).id, input);
  if (!(res as any).error) {
    if (input.leadId) revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
    if (input.contactId) revalidatePath("/[locale]/(routes)/crm/contacts/[contactId]", "page");
  }
  return res;
};
