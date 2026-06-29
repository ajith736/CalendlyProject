/*
  Warnings:

  - A unique constraint covering the columns `[hostId,slug]` on the table `event_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `event_types` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "event_types" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "event_types_hostId_slug_key" ON "event_types"("hostId", "slug");
