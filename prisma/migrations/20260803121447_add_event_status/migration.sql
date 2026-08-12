-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PUBLISHED', 'UNPUBLISHED');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "status" "EventStatus" NOT NULL DEFAULT 'UNPUBLISHED';
