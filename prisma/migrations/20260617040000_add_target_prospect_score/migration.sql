-- Prospecção: score de triagem por presença digital nos targets.
ALTER TABLE "crm_Targets" ADD COLUMN IF NOT EXISTS "prospect_score" INTEGER;
