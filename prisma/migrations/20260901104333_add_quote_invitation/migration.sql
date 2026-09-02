-- CreateTable
CREATE TABLE "QuoteInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "QuoteInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteInvitation_token_key" ON "QuoteInvitation"("token");

-- CreateIndex
CREATE INDEX "QuoteInvitation_email_idx" ON "QuoteInvitation"("email");

-- CreateIndex
CREATE INDEX "QuoteInvitation_expiresAt_idx" ON "QuoteInvitation"("expiresAt");
