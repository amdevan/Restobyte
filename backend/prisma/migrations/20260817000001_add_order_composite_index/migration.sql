-- CreateIndex: Composite index on Order for fast outlet+date queries
CREATE INDEX IF NOT EXISTS "Order_outletId_createdAt_idx" ON "Order"("outletId", "createdAt" DESC);
