/*
  Warnings:

  - You are about to drop the column `escolha` on the `Palpite` table. All the data in the column will be lost.
  - Added the required column `resultado` to the `Palpite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `whatsapp` to the `Palpite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Palpite" DROP COLUMN "escolha",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "resultado" TEXT NOT NULL,
ADD COLUMN     "whatsapp" TEXT NOT NULL;
