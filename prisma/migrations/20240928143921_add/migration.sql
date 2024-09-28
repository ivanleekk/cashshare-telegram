/*
  Warnings:

  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `_PayerTransactions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `totalAmount` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PayerTransactions" DROP CONSTRAINT "_PayerTransactions_A_fkey";

-- DropForeignKey
ALTER TABLE "_PayerTransactions" DROP CONSTRAINT "_PayerTransactions_B_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL;

-- DropTable
DROP TABLE "_PayerTransactions";

-- CreateTable
CREATE TABLE "TransactionPayer" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountOwed" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TransactionPayer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransactionPayer" ADD CONSTRAINT "TransactionPayer_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionPayer" ADD CONSTRAINT "TransactionPayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
