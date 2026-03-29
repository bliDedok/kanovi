-- CreateEnum
CREATE TYPE "PrepStation" AS ENUM ('KITCHEN', 'BAR');

-- CreateEnum
CREATE TYPE "PrepStatus" AS ENUM ('PENDING', 'ACCEPTED', 'STARTED', 'READY', 'SERVED');

-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "prepStation" "PrepStation" NOT NULL DEFAULT 'KITCHEN';

-- AlterTable
ALTER TABLE "OrderDetail" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "prepStation" "PrepStation" NOT NULL DEFAULT 'KITCHEN',
ADD COLUMN     "prepStatus" "PrepStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "readyAt" TIMESTAMP(3),
ADD COLUMN     "servedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OrderDetail_orderId_idx" ON "OrderDetail"("orderId");

-- CreateIndex
CREATE INDEX "OrderDetail_prepStation_prepStatus_idx" ON "OrderDetail"("prepStation", "prepStatus");
