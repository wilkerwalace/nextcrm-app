-- Conversas (pausar agente) + flags de confirmação/lembrete de agendamento
ALTER TABLE "Tenant_Conversation" ADD COLUMN IF NOT EXISTS "agent_paused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "confirmation_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "reminder_sent" BOOLEAN NOT NULL DEFAULT false;
