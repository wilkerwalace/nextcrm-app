"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendText } from "@/lib/integrations/evolution";

function rev() {
  revalidatePath("/[locale]/(routes)/clientes/[tenantId]", "page");
}

export const getConversation = async (conversationId: string) => {
  const session = await getSession();
  if (!session) return null;
  return prismadb.tenant_Conversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { timestamp: "asc" }, take: 200 } },
  });
};

export const toggleConversationPause = async (input: { conversationId: string; paused: boolean }) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  await prismadb.tenant_Conversation.update({
    where: { id: input.conversationId },
    data: { agent_paused: input.paused },
  });
  rev();
  return { data: { ok: true } };
};

/** Mensagem manual de um humano na conversa (whatsapp: envia pela instância do tenant). */
export const sendTenantManualMessage = async (input: { conversationId: string; text: string }) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const text = (input.text || "").trim();
  if (!text) return { error: "Mensagem vazia" };

  const conv = await prismadb.tenant_Conversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, remoteNumber: true, channel: true, clientTenantId: true },
  });
  if (!conv) return { error: "Conversa não encontrada" };

  if (conv.channel === "whatsapp") {
    const tenant = await prismadb.client_Tenant.findUnique({
      where: { id: conv.clientTenantId },
      select: { whatsapp_instance_id: true },
    });
    const inst = tenant?.whatsapp_instance_id
      ? await prismadb.whatsApp_Instance.findUnique({ where: { id: tenant.whatsapp_instance_id } })
      : null;
    if (!inst?.token) return { error: "WhatsApp do cliente não conectado." };
    try {
      await sendText(inst.token, conv.remoteNumber, text);
    } catch (e: any) {
      return { error: e?.message || "Falha ao enviar" };
    }
  }

  await prismadb.tenant_Message.create({
    data: { conversationId: conv.id, direction: "OUT", content: text, status: "sent", timestamp: new Date() },
  });
  rev();
  return { data: { ok: true } };
};
