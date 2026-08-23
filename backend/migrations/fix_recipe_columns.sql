-- Run this on your production PostgreSQL database
-- This adds missing columns to the Recipe table

ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "yieldUnit" TEXT;
ALTER TABLE "Recipe" ADD COLUMN IF NOT EXISTS "notes" TEXT;
