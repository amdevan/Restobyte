-- CreateTable
CREATE TABLE "SaasWebsiteContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "env" TEXT NOT NULL DEFAULT 'default',
    "content" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SaasWebsiteContent_env_key" ON "SaasWebsiteContent"("env");
