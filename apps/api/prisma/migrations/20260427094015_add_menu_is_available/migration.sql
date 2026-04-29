-- AlterTable
ALTER TABLE "Menu" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Menu_isAvailable_idx" ON "Menu"("isAvailable");
