-- DropForeignKey
ALTER TABLE "ExternalRole" DROP CONSTRAINT "ExternalRole_createdBy_fkey";

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "websiteUrl" TEXT;

-- AddForeignKey
ALTER TABLE "ExternalRole" ADD CONSTRAINT "ExternalRole_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
