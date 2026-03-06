/*
  Warnings:

  - The values [ORDER] on the enum `StockReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockReason_new" AS ENUM ('SALE', 'SALE_OVERRIDE', 'RESTOCK', 'ADJUSTMENT', 'SPOIL');
ALTER TABLE "StockMovement" ALTER COLUMN "reason" TYPE "StockReason_new" USING ("reason"::text::"StockReason_new");
ALTER TYPE "StockReason" RENAME TO "StockReason_old";
ALTER TYPE "StockReason_new" RENAME TO "StockReason";
DROP TYPE "StockReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "overrideNote" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stockOverride" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "paymentMethod" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
