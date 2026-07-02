/*
  Warnings:

  - A unique constraint covering the columns `[queueNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_queueNumber_key" ON "Order"("queueNumber");
