-- CreateTable
CREATE TABLE "VolunteerApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "areaOfInterest" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VolunteerApplication_status_idx" ON "VolunteerApplication"("status");
CREATE INDEX "VolunteerApplication_createdAt_idx" ON "VolunteerApplication"("createdAt");