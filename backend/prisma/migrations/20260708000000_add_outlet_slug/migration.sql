
-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN "slug" TEXT NOT NULL DEFAULT '';

-- Update existing outlets to use id as temporary unique slug
UPDATE "Outlet" SET "slug" = id;

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");
