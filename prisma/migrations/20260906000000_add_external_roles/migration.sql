-- CreateTable
CREATE TABLE "ExternalRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleType" TEXT NOT NULL,
    "bio" TEXT,
    "image" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPUBLISHED',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalRole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExternalRole_status_idx" ON "ExternalRole"("status");
CREATE INDEX "ExternalRole_roleType_idx" ON "ExternalRole"("roleType");

ALTER TABLE "ExternalRole" ADD CONSTRAINT "ExternalRole_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE;
