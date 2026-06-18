"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function rev() {
  revalidatePath("/[locale]/(routes)/clientes/[tenantId]", "page");
}

/** Substitui a disponibilidade semanal do tenant. */
export const setAvailability = async (input: {
  clientTenantId: string;
  slots: { weekday: number; start_time: string; end_time: string; slot_minutes?: number }[];
}) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  await prismadb.$transaction([
    prismadb.tenant_Availability.deleteMany({ where: { clientTenantId: input.clientTenantId } }),
    prismadb.tenant_Availability.createMany({
      data: input.slots.map((s) => ({
        clientTenantId: input.clientTenantId,
        weekday: s.weekday,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_minutes: s.slot_minutes || 30,
      })),
    }),
  ]);
  rev();
  return { data: { ok: true } };
};

export const createAppointment = async (input: {
  clientTenantId: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  scheduled_at: string; // ISO
  duration_minutes?: number;
  notes?: string;
  source?: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  const when = new Date(input.scheduled_at);
  if (isNaN(when.getTime())) return { error: "Data/hora inválida" };
  const a = await prismadb.appointment.create({
    data: {
      clientTenantId: input.clientTenantId,
      customer_name: input.customer_name?.trim() || null,
      customer_phone: input.customer_phone?.trim() || null,
      customer_email: input.customer_email?.trim() || null,
      scheduled_at: when,
      duration_minutes: input.duration_minutes || 30,
      notes: input.notes?.trim() || null,
      source: input.source || "manual",
    },
    select: { id: true },
  });
  rev();
  return { data: { id: a.id } };
};

export const updateAppointmentStatus = async (input: { id: string; status: string }) => {
  const session = await getSession();
  if (!session) return { error: "Não autenticado" };
  await prismadb.appointment.update({ where: { id: input.id }, data: { status: input.status } });
  rev();
  return { data: { ok: true } };
};
