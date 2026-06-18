-- Funil de prospecção/proposta + BOT agente (campos no crm_Leads)
ALTER TABLE "crm_Leads"
  ADD COLUMN IF NOT EXISTS "recommendations" TEXT,
  ADD COLUMN IF NOT EXISTS "recommendations_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposal_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "preview_url" TEXT,
  ADD COLUMN IF NOT EXISTS "preview_slug" TEXT,
  ADD COLUMN IF NOT EXISTS "preview_domain" TEXT,
  ADD COLUMN IF NOT EXISTS "bot_status" TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS "bot_draft" TEXT,
  ADD COLUMN IF NOT EXISTS "bot_drafted_at" TIMESTAMP(3);
