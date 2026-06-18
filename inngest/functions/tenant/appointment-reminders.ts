import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { sendAppointmentWhatsApp } from "@/lib/agent/appointment-notify";

/**
 * Cron: a cada 15 min, envia lembrete de agendamentos que começam na próxima
 * ~hora e ainda não foram lembrados (canal com telefone + instância conectada).
 */
export const tenantAppointmentReminders = inngest.createFunction(
  { id: "tenant-appointment-reminders", name: "Tenant: lembretes de agendamento", triggers: [{ cron: "*/15 * * * *" }] },
  async () => {
    const now = new Date();
    const horizon = new Date(now.getTime() + 90 * 60 * 1000); // próximos 90 min

    const due = await prismadb.appointment.findMany({
      where: {
        reminder_sent: false,
        status: { in: ["scheduled", "confirmed"] },
        scheduled_at: { gte: now, lte: horizon },
        customer_phone: { not: null },
      },
      select: { id: true },
      take: 100,
    });

    let sent = 0;
    for (const a of due) {
      const r = await sendAppointmentWhatsApp(a.id, "reminder");
      if ((r as any).sent) sent++;
    }
    return { checked: due.length, sent };
  }
);
