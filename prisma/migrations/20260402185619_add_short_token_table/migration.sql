-- CreateTable
CREATE TABLE "ShortToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortToken_token_key" ON "ShortToken"("token");

-- CreateIndex
CREATE INDEX "ShortToken_type_idx" ON "ShortToken"("type");

-- CreateIndex
CREATE INDEX "ShortToken_expiresAt_idx" ON "ShortToken"("expiresAt");
