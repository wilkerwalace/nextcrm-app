"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateText, aiEnabled } from "@/lib/integrations/ai";

export const generateDesignIdea = async (targetId: string) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  if (!aiEnabled()) return { error: "IA não configurada (DIFY_API_KEY ausente)." };

  const t = await prismadb.crm_Targets.findFirst({
    where: { id: targetId, deletedAt: null },
    select: {
      id: true,
      company: true,
      last_name: true,
      industry: true,
      city: true,
      country: true,
      company_website: true,
      social_instagram: true,
      social_facebook: true,
      notes: true,
    },
  });
  if (!t) return { error: "Alvo não encontrado" };

  const nome = t.company || t.last_name;
  const temSite = !!t.company_website;
  const temRedes = !!(t.social_instagram || t.social_facebook);
  const prompt = [
    `Você é um especialista em web design e geração de demanda. Gere, em PORTUGUÊS DO BRASIL, uma ideia de site/landing page para captar este negócio como cliente de um serviço de criação de sites.`,
    ``,
    `Negócio: ${nome}`,
    `Segmento: ${t.industry || "não informado"}`,
    `Local: ${[t.city, t.country].filter(Boolean).join(", ") || "não informado"}`,
    `Tem site atual: ${temSite ? `sim (${t.company_website})` : "NÃO"}`,
    `Tem redes sociais: ${temRedes ? "sim" : "não detectadas"}`,
    ``,
    `Responda de forma concisa (8 a 12 linhas) com: 1) diagnóstico rápido da presença digital; 2) proposta de site/landing (seções sugeridas e proposta de valor); 3) um CTA; 4) uma mensagem curta de abordagem por WhatsApp para iniciar a conversa.`,
  ].join("\n");

  try {
    const idea = await generateText(prompt);
    if (!idea) return { error: "A IA retornou vazio. Verifique se o app/workflow do Dify está publicado e com um modelo configurado." };

    const stamp = new Date().toISOString().slice(0, 10);
    const note = `💡 Ideia de design (IA, ${stamp}):\n${idea}`;
    const notes = [note, ...((t.notes as string[]) || []).filter((n) => !n.startsWith("💡 Ideia de design"))];
    await prismadb.crm_Targets.update({ where: { id: t.id }, data: { notes } });

    revalidatePath("/[locale]/(routes)/campaigns/targets/[targetId]", "page");
    return { data: { idea } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao gerar ideia" };
  }
};
