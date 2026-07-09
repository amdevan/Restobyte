
-- AlterTable
ALTER TABLE "Outlet" ADD COLUMN "slug" TEXT NOT NULL DEFAULT 'temp-slug';

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_slug_key" ON "Outlet"("slug");
