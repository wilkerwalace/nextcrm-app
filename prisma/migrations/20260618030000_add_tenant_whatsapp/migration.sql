-- E2: WhatsApp por cliente + conversas/mensagens isoladas por tenant
ALTER TABLE "WhatsApp_Instance" ADD COLUMN IF NOT EXISTS "clientTenantId" UUID;
CREATE INDEX IF NOT EXISTS "WhatsApp_Instance_clientTenantId_idx" ON "WhatsApp_Instance"("clientTenantId");

CREATE TABLE IF NOT EXISTS "Tenant_Conversation" (
  "id" UUID NOT NULL,
  "clientTenantId" UUID NOT NULL,
  "remoteNumber" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'whatsapp',
  "name" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "unreadCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_Conversation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_Conversation_clientTenantId_remoteNumber_key" ON "Tenant_Conversation"("clientTenantId","remoteNumber");
CREATE INDEX IF NOT EXISTS "Tenant_Conversation_clientTenantId_idx" ON "Tenant_Conversation"("clientTenantId");

CREATE TABLE IF NOT EXISTS "Tenant_Message" (
  "id" UUID NOT NULL,
  "conversationId" UUID NOT NULL,
  "direction" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "externalId" TEXT,
  "status" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_Message_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Tenant_Message_conversationId_idx" ON "Tenant_Message"("conversationId");

DO $$ BEGIN
  ALTER TABLE "Tenant_Message" ADD CONSTRAINT "Tenant_Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Tenant_Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
