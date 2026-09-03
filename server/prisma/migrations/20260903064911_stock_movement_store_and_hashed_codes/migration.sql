/*
  Warnings:

  - You are about to drop the column `confirmation_code` on the `ClickCollectReservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClickCollectReservation" DROP COLUMN "confirmation_code";

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "store_id" TEXT;

-- CreateIndex
CREATE INDEX "StockMovement_store_id_idx" ON "StockMovement"("store_id");
