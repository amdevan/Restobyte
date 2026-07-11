CREATE TABLE "PrinterJob" (
    "id" TEXT NOT NULL,
    "printerId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "printerName" TEXT NOT NULL,
    "interfaceType" TEXT NOT NULL,
    "printType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "claimedBy" TEXT,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrinterJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PrinterJob_outletId_interfaceType_status_createdAt_idx" ON "PrinterJob"("outletId", "interfaceType", "status", "createdAt");
CREATE INDEX "PrinterJob_printerId_status_createdAt_idx" ON "PrinterJob"("printerId", "status", "createdAt");
