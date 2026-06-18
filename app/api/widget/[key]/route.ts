import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { generateTenantReply } from "@/lib/agent/tenant-agent";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// rate-limit simples em memória: janela de 60s por (key+visitante)
const RL = new Map<string, { n: number; ts: number }>();
const RL_MAX = 20;
const RL_WINDOW = 60_000;
function rateLimited(id: string): boolean {
  const now = Date.now();
  const cur = RL.get(id);
  if (!cur || now - cur.ts > RL_WINDOW) {
    RL.set(id, { n: 1, ts: now });
    if (RL.size > 5000) RL.clear(); // guarda contra crescimento
    return false;
  }
  cur.n++;
  return cur.n > RL_MAX;
}

async function tenantByKey(key: string) {
  if (!key) return null;
  return prismadb.client_Tenant.findFirst({
    where: { widget_key: key, deletedAt: null },
    select: { id: true, name: true, agent_name: true, agent_greeting: true, agent_enabled: true, status: true },
  });
}

/** Config do widget (nome do agente, saudação). */
export async function GET(req: NextRequest, ctx: any) {
  const { key } = await ctx.params;
  const t = await tenantByKey(key);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  return NextResponse.json(
    {
      name: t.name,
      agent_name: t.agent_name || "Assistente",
      greeting: t.agent_greeting || "Olá! Como posso ajudar?",
      enabled: t.agent_enabled && t.status === "active",
    },
    { headers: CORS }
  );
}

/** Mensagem do visitante → resposta do agente. */
export async function POST(req: NextRequest, ctx: any) {
  const { key } = await ctx.params;
  const t = await tenantByKey(key);
  if (!t) return NextResponse.json({ error: "not found" }, { status: 404, headers: CORS });
  if (!t.agent_enabled || t.status !== "active")
    return NextResponse.json({ reply: "Atendimento indisponível no momento." }, { headers: CORS });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const visitorId = String(body?.visitorId || "anon").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "anon";
  const text = String(body?.text || "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400, headers: CORS });

  if (rateLimited(`${key}:${visitorId}`)) {
    return NextResponse.json({ reply: "Você enviou muitas mensagens. Aguarde um instante 🙂" }, { headers: CORS });
  }

  const remoteNumber = `web_${visitorId}`;
  const conv = await prismadb.tenant_Conversation.upsert({
    where: { clientTenantId_remoteNumber: { clientTenantId: t.id, remoteNumber } },
    update: { lastMessageAt: new Date() },
    create: { clientTenantId: t.id, remoteNumber, channel: "widget", lastMessageAt: new Date() },
    select: { id: true },
  });
  await prismadb.tenant_Message.create({
    data: { conversationId: conv.id, direction: "IN", content: text, status: "received", timestamp: new Date() },
  });

  const res = await generateTenantReply(t.id, conv.id);
  return NextResponse.json({ reply: res.reply || "…", scheduled: !!res.scheduled }, { headers: CORS });
}
