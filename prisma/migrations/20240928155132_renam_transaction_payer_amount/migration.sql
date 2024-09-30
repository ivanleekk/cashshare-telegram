/*
  Warnings:

  - You are about to drop the column `amountOwed` on the `TransactionPayer` table. All the data in the column will be lost.
  - Added the required column `amount` to the `TransactionPayer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TransactionPayer" DROP COLUMN "amountOwed",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;
