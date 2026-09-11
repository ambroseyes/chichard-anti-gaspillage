-- AlterTable
ALTER TABLE "BasketReview" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "BrandPartnership" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "CampaignMetrics" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Challenge" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ClickCollectBasket" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ClickCollectReservation" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "CommissionTransaction" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "CustomerSegment" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "DashboardPreference" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "DeliveryAddress" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "DeliveryRoute" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "DigitalReceipt" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ExperienceBooking" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "IdentityVerification" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "LoyaltyReward" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "LoyaltyTransaction" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "PartnerChallenge" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "PartnerStatusHistory" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "PickupRequest" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "PriceComparison" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ProductBatch" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "PromotionRule" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "RecipeRating" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "SavedSearch" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ScamReport" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "SocialPost" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "SponsoredCampaign" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "UserChallenge" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "UserInteraction" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "created_by" TEXT;

-- AlterTable
ALTER TABLE "ZeroWasteTip" ADD COLUMN     "created_by" TEXT;

-- CreateIndex
CREATE INDEX "BasketReview_created_by_idx" ON "BasketReview"("created_by");

-- CreateIndex
CREATE INDEX "BrandPartnership_created_by_idx" ON "BrandPartnership"("created_by");

-- CreateIndex
CREATE INDEX "CampaignMetrics_created_by_idx" ON "CampaignMetrics"("created_by");

-- CreateIndex
CREATE INDEX "CartItem_created_by_idx" ON "CartItem"("created_by");

-- CreateIndex
CREATE INDEX "Challenge_created_by_idx" ON "Challenge"("created_by");

-- CreateIndex
CREATE INDEX "ChatMessage_created_by_idx" ON "ChatMessage"("created_by");

-- CreateIndex
CREATE INDEX "ChatRoom_created_by_idx" ON "ChatRoom"("created_by");

-- CreateIndex
CREATE INDEX "ClickCollectBasket_created_by_idx" ON "ClickCollectBasket"("created_by");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_created_by_idx" ON "ClickCollectReservation"("created_by");

-- CreateIndex
CREATE INDEX "Comment_created_by_idx" ON "Comment"("created_by");

-- CreateIndex
CREATE INDEX "CommissionTransaction_created_by_idx" ON "CommissionTransaction"("created_by");

-- CreateIndex
CREATE INDEX "Coupon_created_by_idx" ON "Coupon"("created_by");

-- CreateIndex
CREATE INDEX "CustomerSegment_created_by_idx" ON "CustomerSegment"("created_by");

-- CreateIndex
CREATE INDEX "DashboardPreference_created_by_idx" ON "DashboardPreference"("created_by");

-- CreateIndex
CREATE INDEX "DeliveryAddress_created_by_idx" ON "DeliveryAddress"("created_by");

-- CreateIndex
CREATE INDEX "DeliveryRoute_created_by_idx" ON "DeliveryRoute"("created_by");

-- CreateIndex
CREATE INDEX "DigitalReceipt_created_by_idx" ON "DigitalReceipt"("created_by");

-- CreateIndex
CREATE INDEX "Experience_created_by_idx" ON "Experience"("created_by");

-- CreateIndex
CREATE INDEX "ExperienceBooking_created_by_idx" ON "ExperienceBooking"("created_by");

-- CreateIndex
CREATE INDEX "Favorite_created_by_idx" ON "Favorite"("created_by");

-- CreateIndex
CREATE INDEX "IdentityVerification_created_by_idx" ON "IdentityVerification"("created_by");

-- CreateIndex
CREATE INDEX "LoyaltyReward_created_by_idx" ON "LoyaltyReward"("created_by");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_created_by_idx" ON "LoyaltyTransaction"("created_by");

-- CreateIndex
CREATE INDEX "Message_created_by_idx" ON "Message"("created_by");

-- CreateIndex
CREATE INDEX "Notification_created_by_idx" ON "Notification"("created_by");

-- CreateIndex
CREATE INDEX "Order_created_by_idx" ON "Order"("created_by");

-- CreateIndex
CREATE INDEX "PartnerChallenge_created_by_idx" ON "PartnerChallenge"("created_by");

-- CreateIndex
CREATE INDEX "PartnerStatusHistory_created_by_idx" ON "PartnerStatusHistory"("created_by");

-- CreateIndex
CREATE INDEX "PickupRequest_created_by_idx" ON "PickupRequest"("created_by");

-- CreateIndex
CREATE INDEX "PriceComparison_created_by_idx" ON "PriceComparison"("created_by");

-- CreateIndex
CREATE INDEX "Product_created_by_idx" ON "Product"("created_by");

-- CreateIndex
CREATE INDEX "ProductBatch_created_by_idx" ON "ProductBatch"("created_by");

-- CreateIndex
CREATE INDEX "ProductVariant_created_by_idx" ON "ProductVariant"("created_by");

-- CreateIndex
CREATE INDEX "Promotion_created_by_idx" ON "Promotion"("created_by");

-- CreateIndex
CREATE INDEX "PromotionRule_created_by_idx" ON "PromotionRule"("created_by");

-- CreateIndex
CREATE INDEX "Recipe_created_by_idx" ON "Recipe"("created_by");

-- CreateIndex
CREATE INDEX "RecipeRating_created_by_idx" ON "RecipeRating"("created_by");

-- CreateIndex
CREATE INDEX "Review_created_by_idx" ON "Review"("created_by");

-- CreateIndex
CREATE INDEX "SavedSearch_created_by_idx" ON "SavedSearch"("created_by");

-- CreateIndex
CREATE INDEX "ScamReport_created_by_idx" ON "ScamReport"("created_by");

-- CreateIndex
CREATE INDEX "ShoppingList_created_by_idx" ON "ShoppingList"("created_by");

-- CreateIndex
CREATE INDEX "SocialPost_created_by_idx" ON "SocialPost"("created_by");

-- CreateIndex
CREATE INDEX "SponsoredCampaign_created_by_idx" ON "SponsoredCampaign"("created_by");

-- CreateIndex
CREATE INDEX "StockMovement_created_by_idx" ON "StockMovement"("created_by");

-- CreateIndex
CREATE INDEX "Store_created_by_idx" ON "Store"("created_by");

-- CreateIndex
CREATE INDEX "User_created_by_idx" ON "User"("created_by");

-- CreateIndex
CREATE INDEX "UserChallenge_created_by_idx" ON "UserChallenge"("created_by");

-- CreateIndex
CREATE INDEX "UserInteraction_created_by_idx" ON "UserInteraction"("created_by");

-- CreateIndex
CREATE INDEX "UserPreference_created_by_idx" ON "UserPreference"("created_by");

-- CreateIndex
CREATE INDEX "ZeroWasteTip_created_by_idx" ON "ZeroWasteTip"("created_by");
