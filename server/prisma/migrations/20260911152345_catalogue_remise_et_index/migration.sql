-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discount_percent" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "ClickCollectBasket_discounted_price_idx" ON "ClickCollectBasket"("discounted_price");

-- CreateIndex
CREATE INDEX "PriceComparison_brand_idx" ON "PriceComparison"("brand");

-- CreateIndex
CREATE INDEX "Product_discounted_price_idx" ON "Product"("discounted_price");

-- CreateIndex
CREATE INDEX "Product_discount_percent_idx" ON "Product"("discount_percent");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_avg_rating_idx" ON "Product"("avg_rating");

-- Rattrapage des lignes existantes : sans cela, tous les produits déjà en base
-- afficheraient 0 % de remise et le tri « meilleure remise » serait vide.
UPDATE "Product"
SET "discount_percent" = GREATEST(0, LEAST(100, ROUND((1 - "discounted_price" / "original_price") * 100)::int))
WHERE "original_price" > 0;
