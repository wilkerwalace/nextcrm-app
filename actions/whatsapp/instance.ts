"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import {
  createInstance,
  connectInstance,
  getQr,
  getStatus,
} from "@/lib/integrations/evolution";

const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || "amzc";

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" as const };
  if ((session.user as any).role !== "admin") return { error: "Acesso restrito a administradores" as const };
  return { session };
}

function webhookUrl() {
  const base =
    process.env.EVOLUTION_WEBHOOK_TARGET || "http://nextcrm:3000/api/webhooks/whatsapp";
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET || "";
  return `${base}?secret=${encodeURIComponent(secret)}`;
}

/** Garante a instância no banco + na EvolutionGO. Conecta e define o webhook (dispara QR). */
export const connectWhatsApp = async (phone?: string) => {
  const g = await requireAdmin();
  if ("error" in g) return { error: g.error };

  try {
    let inst = await prismadb.whatsApp_Instance.findUnique({ where: { instanceName: INSTANCE_NAME } });
    if (!inst || !inst.token) {
      const created = await createInstance(INSTANCE_NAME);
      inst = await prismadb.whatsApp_Instance.upsert({
        where: { instanceName: INSTANCE_NAME },
        update: { evolutionId: created.evolutionId, token: created.token, status: "created" },
        create: { instanceName: INSTANCE_NAME, evolutionId: created.evolutionId, token: created.token, status: "created" },
      });
    }
    await connectInstance(inst.token!, { phone, webhookUrl: webhookUrl() });
    await prismadb.whatsApp_Instance.update({
      where: { id: inst.id },
      data: { status: "connecting", webhookSet: true },
    });
    return { data: { ok: true } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao conectar" };
  }
};

export const getWhatsAppQr = async () => {
  const g = await requireAdmin();
  if ("error" in g) return { error: g.error };
  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { instanceName: INSTANCE_NAME } });
  if (!inst?.token) return { error: "Instância não criada. Clique em Conectar." };
  try {
    const r = await getQr(inst.token);
    // a API pode retornar { data: { qrcode/base64 } } ou { qrcode }
    const qr = r?.data?.qrcode || r?.data?.base64 || r?.qrcode || r?.base64 || r?.data?.code || null;
    return { data: { qr } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao obter QR" };
  }
};

export const getWhatsAppStatus = async () => {
  const g = await requireAdmin();
  if ("error" in g) return { error: g.error };
  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { instanceName: INSTANCE_NAME } });
  if (!inst?.token) return { data: { exists: false, connected: false } };
  try {
    const r = await getStatus(inst.token);
    const d = r?.data || {};
    const connected = !!(d.Connected || d.connected);
    const loggedIn = !!(d.LoggedIn || d.loggedIn);
    await prismadb.whatsApp_Instance.update({
      where: { id: inst.id },
      data: { status: loggedIn ? "connected" : connected ? "connecting" : "disconnected", numberConnected: d.Name || inst.numberConnected },
    });
    return { data: { exists: true, connected, loggedIn, name: d.Name || inst.numberConnected || null } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao consultar status" };
  }
};
