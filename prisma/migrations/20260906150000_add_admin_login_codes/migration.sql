-- Add temporary fields used for admin login email verification
ALTER TABLE "User"
ADD COLUMN "adminLoginCodeHash" TEXT,
ADD COLUMN "adminLoginCodeExpiry" TIMESTAMP(3),
ADD COLUMN "adminLoginChallenge" TEXT;

CREATE UNIQUE INDEX "User_adminLoginChallenge_key" ON "User"("adminLoginChallenge");
