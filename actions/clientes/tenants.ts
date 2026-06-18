"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const listTenants = async () => {
  const session = await getSession();
  if (!session) return [];
  return prismadb.client_Tenant.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { appointments: true } } },
  });
};

export const getTenant = async (id: string) => {
  const session = await getSession();
  if (!session) return null;
  const data = await prismadb.client_Tenant.findFirst({
    where: { id, deletedAt: null },
    include: {
      availability: { orderBy: [{ weekday: "asc" }, { start_time: "asc" }] },
      appointments: { orderBy: { scheduled_at: "desc" }, take: 100 },
    },
  });
  if (!data) return null;
  const conversations = await prismadb.tenant_Conversation.findMany({
    where: { clientTenantId: id },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    include: { _count: { select: { messages: true } } },
  });
  return { ...data, conversations };
};

export const createTenant = async (input: {
  name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const name = (input.name || "").trim();
  if (!name) return { error: "Nome obrigatório" };

  let slug = slugify(name) || "cliente";
  // garante slug único
  const exists = await prismadb.client_Tenant.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const t = await prismadb.client_Tenant.create({
    data: {
      name,
      slug,
      contact_name: input.contact_name?.trim() || null,
      contact_email: input.contact_email?.trim() || null,
      contact_phone: input.contact_phone?.trim() || null,
      widget_key: "wgt_" + randomBytes(16).toString("hex"),
      createdBy: (session.user as any).id,
    },
    select: { id: true },
  });
  revalidatePath("/[locale]/(routes)/clientes", "page");
  return { data: { id: t.id } };
};

export const updateTenant = async (input: {
  id: string;
  name?: string;
  status?: string;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  notes?: string | null;
  whatsapp_instance_id?: string | null;
  agent_enabled?: boolean;
  agent_name?: string | null;
  agent_persona?: string | null;
  agent_greeting?: string | null;
}) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const { id, ...rest } = input;
  await prismadb.client_Tenant.update({ where: { id }, data: rest as any });
  revalidatePath("/[locale]/(routes)/clientes/[tenantId]", "page");
  return { data: { ok: true } };
};

export const regenWidgetKey = async (id: string) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const widget_key = "wgt_" + randomBytes(16).toString("hex");
  await prismadb.client_Tenant.update({ where: { id }, data: { widget_key } });
  revalidatePath("/[locale]/(routes)/clientes/[tenantId]", "page");
  return { data: { widget_key } };
};

export const deleteTenant = async (id: string) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  await prismadb.client_Tenant.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/[locale]/(routes)/clientes", "page");
  return { data: { ok: true } };
};
