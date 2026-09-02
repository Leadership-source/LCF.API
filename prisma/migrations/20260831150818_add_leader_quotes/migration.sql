-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QuoteSource" AS ENUM ('ADMIN', 'INVITATION');

-- CreateTable
CREATE TABLE "LeaderQuote" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "QuoteSource" NOT NULL DEFAULT 'ADMIN',
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "LeaderQuote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderQuote_status_idx" ON "LeaderQuote"("status");

-- CreateIndex
CREATE INDEX "LeaderQuote_source_idx" ON "LeaderQuote"("source");

-- CreateIndex
CREATE INDEX "LeaderQuote_createdAt_idx" ON "LeaderQuote"("createdAt");
