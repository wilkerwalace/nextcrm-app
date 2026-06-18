"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateText, aiEnabled } from "@/lib/integrations/ai";
import { sendWhatsAppCore } from "@/actions/whatsapp/send-message";

const PREVIEW_BASE = process.env.PREVIEW_BASE_DOMAIN || "preview.amzc.tech";

function revalidate() {
  revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
}

/** Salva os artefatos de proposta (imagens, prévia, domínio). */
export const saveLeadProposal = async (input: {
  leadId: string;
  proposal_images?: string[];
  preview_url?: string | null;
  preview_slug?: string | null;
  preview_domain?: string | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };

  const slug = (input.preview_slug || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  const previewUrl =
    (input.preview_url || "").trim() || (slug ? `https://${slug}.${PREVIEW_BASE}` : null);

  try {
    await prismadb.crm_Leads.update({
      where: { id: input.leadId },
      data: {
        ...(input.proposal_images ? { proposal_images: input.proposal_images } : {}),
        preview_url: previewUrl,
        preview_slug: slug || null,
        preview_domain: (input.preview_domain || "").trim() || null,
      },
    });
    revalidate();
    return { data: { ok: true, preview_url: previewUrl } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao salvar proposta" };
  }
};

/** Gera o RASCUNHO da 1ª mensagem do bot (aguarda aprovação humana antes de enviar). */
export const draftBotMessage = async (leadId: string) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (!aiEnabled()) return { error: "IA não configurada (DIFY_API_KEY ausente)." };

  const l = await prismadb.crm_Leads.findFirst({
    where: { id: leadId, deletedAt: null },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      phone: true,
      recommendations: true,
      preview_url: true,
    },
  });
  if (!l) return { error: "Lead não encontrado" };
  if (!l.phone) return { error: "Este lead não tem telefone para o bot contatar." };

  const nome = l.company || [l.firstName, l.lastName].filter(Boolean).join(" ") || "Cliente";
  const prompt = [
    `Você é um SDR cordial. Escreva, em PORTUGUÊS DO BRASIL, UMA mensagem curta de WhatsApp (máx. 4 frases) para abrir conversa com este possível cliente, apresentando uma proposta de site/landing page. Tom humano, sem parecer spam, com um convite claro para ver a prévia. NÃO use colchetes nem placeholders — escreva pronto para enviar.`,
    ``,
    `Negócio: ${nome}`,
    l.preview_url ? `Link da prévia para incluir na mensagem: ${l.preview_url}` : `Ainda não há link de prévia; convide para uma conversa rápida.`,
    l.recommendations ? `\nContexto (recomendações internas, não copie literalmente):\n${l.recommendations.slice(0, 1200)}` : ``,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const text = await generateText(prompt);
    if (!text) return { error: "A IA retornou vazio." };
    await prismadb.crm_Leads.update({
      where: { id: l.id },
      data: { bot_draft: text, bot_status: "draft", bot_drafted_at: new Date() },
    });
    revalidate();
    return { data: { draft: text } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao gerar rascunho" };
  }
};

/** Aprova e ENVIA a mensagem do bot pelo WhatsApp; ativa o bot para a conversa. */
export const sendBotMessage = async (input: { leadId: string; text: string }) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const userId = (session.user as any).id as string;

  const l = await prismadb.crm_Leads.findFirst({
    where: { id: input.leadId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, company: true, phone: true },
  });
  if (!l) return { error: "Lead não encontrado" };
  if (!l.phone) return { error: "Lead sem telefone." };
  const text = (input.text || "").trim();
  if (!text) return { error: "Mensagem vazia." };

  const res = await sendWhatsAppCore(userId, {
    number: l.phone,
    text,
    leadId: l.id,
    name: l.company || [l.firstName, l.lastName].filter(Boolean).join(" ") || undefined,
  });
  if ((res as any).error) return { error: (res as any).error };

  await prismadb.crm_Leads.update({
    where: { id: l.id },
    data: { bot_status: "active", bot_draft: null },
  });
  revalidate();
  return { data: { ok: true } };
};

/** Atualiza o estado do bot para o lead (ex.: pausar/handoff). */
export const setLeadBotStatus = async (input: { leadId: string; status: string }) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  await prismadb.crm_Leads.update({
    where: { id: input.leadId },
    data: { bot_status: input.status },
  });
  revalidate();
  return { data: { ok: true } };
};
