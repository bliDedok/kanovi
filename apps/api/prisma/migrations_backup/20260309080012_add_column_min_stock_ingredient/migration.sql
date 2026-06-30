/*
  Warnings:

  - Added the required column `minStock` to the `Ingredient` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "minStock" INTEGER NOT NULL,
ALTER COLUMN "stock" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "Ingredient_stock_idx" ON "Ingredient"("stock");

-- CreateIndex
CREATE INDEX "Ingredient_minStock_idx" ON "Ingredient"("minStock");
