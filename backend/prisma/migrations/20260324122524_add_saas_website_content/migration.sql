-- CreateTable
CREATE TABLE "SaasWebsiteContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "env" TEXT NOT NULL DEFAULT 'default',
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SaasWebsiteContent_env_key" ON "SaasWebsiteContent"("env");

