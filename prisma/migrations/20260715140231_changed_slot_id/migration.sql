/*
  Warnings:

  - The primary key for the `slots` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_slotId_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "slotId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "slots" DROP CONSTRAINT "slots_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "slots_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "slots_id_seq";

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
