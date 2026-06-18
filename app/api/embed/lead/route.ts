import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Contexto do lead para o Dashboard App do Chatwoot (lateral da conversa).
 * Autenticado por token compartilhado (EMBED_TOKEN) — o iframe roda sem sessão do CRM.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || "";
  if (!process.env.EMBED_TOKEN || token !== process.env.EMBED_TOKEN) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const phoneRaw = req.nextUrl.searchParams.get("phone") || "";
  const phone = phoneRaw.replace(/\D/g, "");
  if (!phone) return NextResponse.json({ lead: null });

  // tenta achar por telefone (com e sem variações simples)
  const lead = await prismadb.crm_Leads.findFirst({
    where: {
      deletedAt: null,
      OR: [{ phone }, { phone: `+${phone}` }, { phone: { endsWith: phone.slice(-8) } }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      phone: true,
      bot_status: true,
      preview_url: true,
      recommendations: true,
      lead_status: { select: { name: true } },
    },
  });
  if (!lead) return NextResponse.json({ lead: null });

  return NextResponse.json({
    lead: {
      id: lead.id,
      name: lead.company || [lead.firstName, lead.lastName].filter(Boolean).join(" "),
      phone: lead.phone,
      status: lead.lead_status?.name || null,
      bot_status: lead.bot_status,
      preview_url: lead.preview_url,
      recommendations: lead.recommendations ? lead.recommendations.slice(0, 1500) : null,
      url: `https://crm.amzc.tech/crm/leads/${lead.id}`,
    },
  });
}
