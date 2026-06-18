/** Envia confirmação/lembrete de agendamento pelo WhatsApp do cliente (tenant). */
import { prismadb } from "@/lib/prisma";
import { sendText, onlyDigits } from "@/lib/integrations/evolution";

export async function sendAppointmentWhatsApp(appointmentId: string, kind: "confirmation" | "reminder") {
  const a = await prismadb.appointment.findUnique({ where: { id: appointmentId } });
  if (!a) return { skipped: "appt" };
  const phone = onlyDigits(a.customer_phone || "");
  if (!phone) return { skipped: "sem telefone" };

  const tenant = await prismadb.client_Tenant.findUnique({
    where: { id: a.clientTenantId },
    select: { name: true, whatsapp_instance_id: true },
  });
  if (!tenant?.whatsapp_instance_id) return { skipped: "tenant sem whatsapp" };
  const inst = await prismadb.whatsApp_Instance.findUnique({ where: { id: tenant.whatsapp_instance_id } });
  if (!inst?.token) return { skipped: "instância sem token" };

  const quando = a.scheduled_at.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
  const nome = a.customer_name ? `${a.customer_name}, ` : "";
  const msg =
    kind === "confirmation"
      ? `Olá ${nome}seu agendamento em ${tenant.name} está confirmado para ${quando}. Até lá! 😊`
      : `Olá ${nome}lembrete do seu horário em ${tenant.name}: ${quando}. Podemos confirmar? 😊`;

  try {
    await sendText(inst.token, phone, msg);
    await prismadb.appointment.update({
      where: { id: a.id },
      data: kind === "confirmation" ? { confirmation_sent: true } : { reminder_sent: true },
    });
    return { sent: true };
  } catch (e: any) {
    return { error: e?.message || "falha ao enviar" };
  }
}
