-- CreateTable
CREATE TABLE "WhatsApp_Instance" (
    "id" UUID NOT NULL,
    "instanceName" TEXT NOT NULL,
    "evolutionId" UUID,
    "token" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "numberConnected" TEXT,
    "webhookSet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsApp_Instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsApp_Conversation" (
    "id" UUID NOT NULL,
    "remoteNumber" TEXT NOT NULL,
    "name" TEXT,
    "contactId" UUID,
    "leadId" UUID,
    "chatwoot_contact_id" TEXT,
    "chatwoot_conversation_id" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsApp_Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsApp_Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "evolutionMessageId" TEXT,
    "status" TEXT,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsApp_Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsApp_Instance_instanceName_key" ON "WhatsApp_Instance"("instanceName");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsApp_Conversation_remoteNumber_key" ON "WhatsApp_Conversation"("remoteNumber");

-- CreateIndex
CREATE INDEX "WhatsApp_Conversation_contactId_idx" ON "WhatsApp_Conversation"("contactId");

-- CreateIndex
CREATE INDEX "WhatsApp_Conversation_leadId_idx" ON "WhatsApp_Conversation"("leadId");

-- CreateIndex
CREATE INDEX "WhatsApp_Conversation_lastMessageAt_idx" ON "WhatsApp_Conversation"("lastMessageAt");

-- CreateIndex
CREATE INDEX "WhatsApp_Message_conversationId_idx" ON "WhatsApp_Message"("conversationId");

-- CreateIndex
CREATE INDEX "WhatsApp_Message_timestamp_idx" ON "WhatsApp_Message"("timestamp");

-- AddForeignKey
ALTER TABLE "WhatsApp_Message" ADD CONSTRAINT "WhatsApp_Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsApp_Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
