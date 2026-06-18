-- Plataforma multi-tenant: Clientes/Tenants + Agenda interna
CREATE TABLE IF NOT EXISTS "Client_Tenant" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "contact_name" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "notes" TEXT,
  "whatsapp_instance_id" UUID,
  "widget_key" TEXT,
  "agent_enabled" BOOLEAN NOT NULL DEFAULT true,
  "agent_name" TEXT DEFAULT 'Assistente',
  "agent_persona" TEXT,
  "agent_greeting" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" UUID,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Client_Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Client_Tenant_slug_key" ON "Client_Tenant"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Client_Tenant_widget_key_key" ON "Client_Tenant"("widget_key");
CREATE INDEX IF NOT EXISTS "Client_Tenant_status_idx" ON "Client_Tenant"("status");
CREATE INDEX IF NOT EXISTS "Client_Tenant_deletedAt_idx" ON "Client_Tenant"("deletedAt");

CREATE TABLE IF NOT EXISTS "Tenant_Availability" (
  "id" UUID NOT NULL,
  "clientTenantId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "start_time" TEXT NOT NULL,
  "end_time" TEXT NOT NULL,
  "slot_minutes" INTEGER NOT NULL DEFAULT 30,
  CONSTRAINT "Tenant_Availability_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Tenant_Availability_clientTenantId_idx" ON "Tenant_Availability"("clientTenantId");

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" UUID NOT NULL,
  "clientTenantId" UUID NOT NULL,
  "customer_name" TEXT,
  "customer_phone" TEXT,
  "customer_email" TEXT,
  "scheduled_at" TIMESTAMP(3) NOT NULL,
  "duration_minutes" INTEGER NOT NULL DEFAULT 30,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "notes" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Appointment_clientTenantId_scheduled_at_idx" ON "Appointment"("clientTenantId","scheduled_at");
CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status");

DO $$ BEGIN
  ALTER TABLE "Tenant_Availability" ADD CONSTRAINT "Tenant_Availability_clientTenantId_fkey" FOREIGN KEY ("clientTenantId") REFERENCES "Client_Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientTenantId_fkey" FOREIGN KEY ("clientTenantId") REFERENCES "Client_Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
