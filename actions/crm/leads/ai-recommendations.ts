"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { generateText, aiEnabled } from "@/lib/integrations/ai";

/**
 * A IA analisa o cliente/prospect e grava no CRM um bloco estruturado de
 * Recomendações/Oportunidades que o operador lê para criar a proposta.
 */
export const generateLeadRecommendations = async (leadId: string) => {
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
      jobTitle: true,
      email: true,
      phone: true,
      description: true,
    },
  });
  if (!l) return { error: "Lead não encontrado" };

  const nome = l.company || [l.firstName, l.lastName].filter(Boolean).join(" ") || "Cliente";
  const prompt = [
    `Você é um consultor sênior de aquisição de clientes e web design. Analise o negócio abaixo e produza, em PORTUGUÊS DO BRASIL e em Markdown, um relatório curto e acionável para a equipe que vai criar um site/landing page e abordar este cliente.`,
    ``,
    `## Dados do negócio`,
    `- Nome/Empresa: ${nome}`,
    l.jobTitle ? `- Cargo/segmento: ${l.jobTitle}` : ``,
    l.email ? `- E-mail: ${l.email}` : ``,
    l.phone ? `- Telefone: ${l.phone}` : ``,
    l.description ? `- Observações: ${l.description}` : ``,
    ``,
    `## Formato da resposta (use exatamente estes títulos)`,
    `### Diagnóstico de presença digital`,
    `(2-4 linhas sobre prováveis lacunas: site, redes, captação)`,
    `### Oportunidades`,
    `(lista de 3 a 5 oportunidades concretas de melhoria/venda)`,
    `### Proposta de site/landing`,
    `(seções recomendadas + proposta de valor central)`,
    `### Ângulo de venda`,
    `(como abordar: dor principal + benefício + prova)`,
    `### Mensagem de abertura sugerida (WhatsApp)`,
    `(1 parágrafo curto, tom cordial e profissional, pronto para enviar)`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const text = await generateText(prompt);
    if (!text)
      return { error: "A IA retornou vazio. Verifique o workflow do Dify (publicado, com modelo)." };

    await prismadb.crm_Leads.update({
      where: { id: l.id },
      data: { recommendations: text, recommendations_at: new Date() },
    });
    revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
    return { data: { recommendations: text } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao gerar recomendações" };
  }
};
