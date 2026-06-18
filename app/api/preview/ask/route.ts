import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PREVIEW_BASE = process.env.PREVIEW_BASE_DOMAIN || "preview.amzc.tech";

/**
 * Endpoint de autorização do on-demand TLS do Caddy.
 * Caddy chama GET /api/preview/ask?domain=<host> antes de emitir um certificado.
 * Autoriza (200) se for um subdomínio de *.preview.amzc.tech OU um domínio
 * próprio já cadastrado em algum lead. Caso contrário, 404 (Caddy não emite).
 */
export async function GET(req: NextRequest) {
  const domain = (req.nextUrl.searchParams.get("domain") || "").toLowerCase().trim();
  if (!domain) return new NextResponse("no domain", { status: 400 });

  if (domain === PREVIEW_BASE || domain.endsWith(`.${PREVIEW_BASE}`)) {
    return new NextResponse("ok", { status: 200 });
  }

  const lead = await prismadb.crm_Leads.findFirst({
    where: { preview_domain: domain, deletedAt: null },
    select: { id: true },
  });
  if (lead) return new NextResponse("ok", { status: 200 });

  return new NextResponse("not allowed", { status: 404 });
}
