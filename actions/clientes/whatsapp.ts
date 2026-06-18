"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createInstance, connectInstance, getQr, getStatus } from "@/lib/integrations/evolution";

function tenantWebhookUrl(tenantId: string) {
  const base = process.env.EVOLUTION_WEBHOOK_TARGET || "http://nextcrm:3000/api/webhooks/whatsapp";
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET || "";
  return `${base}?secret=${encodeURIComponent(secret)}&tenant=${encodeURIComponent(tenantId)}`;
}

async function auth() {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" as const };
  return { session };
}

async function loadTenant(tenantId: string) {
  return prismadb.client_Tenant.findFirst({
    where: { id: tenantId, deletedAt: null },
    select: { id: true, slug: true, whatsapp_instance_id: true },
  });
}

/** Cria/garante a instância dedicada do cliente e conecta (dispara QR). */
export const connectTenantWhatsApp = async (tenantId: string, phone?: string) => {
  const g = await auth();
  if ("error" in g) return { error: g.error };
  const t = await loadTenant(tenantId);
  if (!t) return { error: "Cliente não encontrado" };

  const instanceName = `t_${t.slug}`.slice(0, 40);
  try {
    let inst = await prismadb.whatsApp_Instance.findUnique({ where: { instanceName } });
    if (!inst || !inst.token) {
      const created = await createInstance(instanceName);
      inst = await prismadb.whatsApp_Instance.upsert({
        where: { instanceName },
        update: { evolutionId: created.evolutionId, token: created.token, status: "created", clientTenantId: t.id },
        create: { instanceName, evolutionId: created.evolutionId, token: created.token, status: "created", clientTenantId: t.id },
      });
    }
    if (t.whatsapp_instance_id !== inst.id) {
      await prismadb.client_Tenant.update({ where: { id: t.id }, data: { whatsapp_instance_id: inst.id } });
    }
    await connectInstance(inst.token!, { phone, webhookUrl: tenantWebhookUrl(t.id) });
    await prismadb.whatsApp_Instance.update({ where: { id: inst.id }, data: { status: "connecting", webhookSet: true } });
    revalidatePath("/[locale]/(routes)/clientes/[tenantId]", "page");
    return { data: { ok: true } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao conectar" };
  }
};

export const getTenantWhatsAppQr = async (tenantId: string) => {
  const g = await auth();
  if ("error" in g) return { error: g.error };
  const t = await loadTenant(tenantId);
  if (!t?.whatsapp_instance_id) return { error: "Instância não criada. Clique em Conectar." };
  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { id: t.whatsapp_instance_id } });
  if (!inst?.token) return { error: "Instância sem token." };
  try {
    const r = await getQr(inst.token);
    const qr = r?.data?.Qrcode || r?.data?.qrcode || r?.data?.QRCode || r?.data?.base64 || r?.qrcode || r?.base64 || null;
    return { data: { qr } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao obter QR" };
  }
};

export const getTenantWhatsAppStatus = async (tenantId: string) => {
  const g = await auth();
  if ("error" in g) return { error: g.error };
  const t = await loadTenant(tenantId);
  if (!t?.whatsapp_instance_id) return { data: { exists: false, connected: false } };
  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { id: t.whatsapp_instance_id } });
  if (!inst?.token) return { data: { exists: false, connected: false } };
  try {
    const r = await getStatus(inst.token);
    const d = r?.data || {};
    const connected = !!(d.Connected || d.connected);
    const loggedIn = !!(d.LoggedIn || d.loggedIn);
    await prismadb.whatsApp_Instance.update({
      where: { id: inst.id },
      data: {
        status: loggedIn ? "connected" : connected ? "connecting" : "disconnected",
        numberConnected: d.Name || inst.numberConnected,
      },
    });
    return { data: { exists: true, connected, loggedIn, name: d.Name || inst.numberConnected || null } };
  } catch (e: any) {
    return { error: e?.message || "Falha ao consultar status" };
  }
};
