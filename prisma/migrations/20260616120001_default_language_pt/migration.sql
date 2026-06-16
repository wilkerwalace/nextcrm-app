-- Set default user language to pt (runs after 'pt' is committed by the prior migration).
ALTER TABLE "Users" ALTER COLUMN "userLanguage" SET DEFAULT 'pt';
