/*
  Warnings:

  - Added the required column `nome` to the `Palpite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Palpite" ADD COLUMN     "nome" TEXT NOT NULL;
