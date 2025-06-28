/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Palpite` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[whatsapp]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `whatsapp` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Palpite" DROP CONSTRAINT "Palpite_userId_fkey";

-- AlterTable
ALTER TABLE "Palpite" DROP COLUMN "createdAt",
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "whatsapp" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
