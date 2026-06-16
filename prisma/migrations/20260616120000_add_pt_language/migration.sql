-- Add 'pt' (Português do Brasil) to the Language enum.
-- Separate migration: PostgreSQL forbids using a new enum value in the same
-- transaction that adds it, so the default change lives in the next migration.
ALTER TYPE "Language" ADD VALUE IF NOT EXISTS 'pt';
