-- CreateEnum
CREATE TYPE "BrandPartnershipPartnershipStatus" AS ENUM ('pending', 'active', 'suspended', 'terminated');

-- CreateEnum
CREATE TYPE "ChallengeChallengeType" AS ENUM ('weekly', 'monthly', 'special');

-- CreateEnum
CREATE TYPE "ChallengeGoalType" AS ENUM ('savings', 'orders', 'waste_avoided', 'products_saved', 'referrals');

-- CreateEnum
CREATE TYPE "ChatMessageMessageType" AS ENUM ('text', 'image', 'link', 'product');

-- CreateEnum
CREATE TYPE "ChatRoomCategory" AS ENUM ('recettes', 'astuces', 'defis', 'bons_plans', 'general');

-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "ClickCollectBasketBasketType" AS ENUM ('surprise_basket', 'specific_products');

-- CreateEnum
CREATE TYPE "ClickCollectBasketStatus" AS ENUM ('active', 'sold_out', 'expired');

-- CreateEnum
CREATE TYPE "ClickCollectReservationPaymentMethod" AS ENUM ('orange_money', 'mtn_money', 'card', 'cash_on_pickup');

-- CreateEnum
CREATE TYPE "ClickCollectReservationPaymentStatus" AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- CreateEnum
CREATE TYPE "ClickCollectReservationStatus" AS ENUM ('reserved', 'confirmed', 'ready', 'collected', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "CommissionTransactionStatus" AS ENUM ('pending', 'approved', 'paid', 'cancelled');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "CustomerSegmentPriceSensitivity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "CustomerSegmentSegmentType" AS ENUM ('new', 'regular', 'vip', 'at_risk', 'dormant');

-- CreateEnum
CREATE TYPE "DashboardPreferenceDashboardType" AS ENUM ('partner', 'driver');

-- CreateEnum
CREATE TYPE "DeliveryRouteStatus" AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DigitalReceiptCashbackStatus" AS ENUM ('pending', 'approved', 'paid');

-- CreateEnum
CREATE TYPE "ExperienceBookingStatus" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');

-- CreateEnum
CREATE TYPE "ExperienceExperienceType" AS ENUM ('workshop', 'visit', 'tasting', 'class', 'event');

-- CreateEnum
CREATE TYPE "ExperienceTierRequired" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('pending', 'approved', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "IdentityVerificationVerificationLevel" AS ENUM ('basic', 'advanced', 'premium');

-- CreateEnum
CREATE TYPE "IdentityVerificationVerificationType" AS ENUM ('id_card', 'passport', 'business_license', 'phone_verification');

-- CreateEnum
CREATE TYPE "LoyaltyRewardRewardType" AS ENUM ('discount', 'free_delivery', 'exclusive_product', 'badge', 'experience');

-- CreateEnum
CREATE TYPE "LoyaltyRewardTierRequired" AS ENUM ('bronze', 'silver', 'gold', 'platinum');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionSource" AS ENUM ('purchase', 'challenge', 'referral', 'bonus', 'redemption');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('earn', 'redeem');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order', 'deal', 'expiration', 'badge', 'challenge', 'social', 'system');

-- CreateEnum
CREATE TYPE "OrderDeliveryType" AS ENUM ('pickup', 'delivery');

-- CreateEnum
CREATE TYPE "OrderPaymentMethod" AS ENUM ('orange_money', 'mtn_money', 'cash', 'card');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'ready', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PartnerChallengeGoalType" AS ENUM ('purchases', 'amount', 'products', 'visits');

-- CreateEnum
CREATE TYPE "PartnerChallengeRewardType" AS ENUM ('discount', 'points', 'free_product', 'badge');

-- CreateEnum
CREATE TYPE "PartnerStatusHistoryNewStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "PartnerStatusHistoryPreviousStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "PickupRequestStatus" AS ENUM ('requested', 'confirmed', 'ready', 'picked_up', 'cancelled');

-- CreateEnum
CREATE TYPE "ProductBatchStatus" AS ENUM ('active', 'low_stock', 'expired', 'sold_out');

-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('fruits_legumes', 'produits_laitiers', 'viandes_poissons', 'boulangerie', 'epicerie', 'boissons', 'surgeles', 'hygiene', 'conserves', 'condiments');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'sold_out', 'expired', 'reserved', 'pending_review', 'flagged');

-- CreateEnum
CREATE TYPE "ProductUrgencyLevel" AS ENUM ('normal', 'soon', 'urgent', 'critical');

-- CreateEnum
CREATE TYPE "ProductWeightUnit" AS ENUM ('g', 'kg', 'L', 'mL', 'piece');

-- CreateEnum
CREATE TYPE "PromotionDiscountType" AS ENUM ('percentage', 'fixed_amount');

-- CreateEnum
CREATE TYPE "PromotionRuleAppliesTo" AS ENUM ('all_products', 'specific_category', 'specific_products');

-- CreateEnum
CREATE TYPE "PromotionRuleTriggerType" AS ENUM ('dlc_based', 'stock_based', 'time_based', 'manual');

-- CreateEnum
CREATE TYPE "RecipeCategory" AS ENUM ('petit_dejeuner', 'dejeuner', 'diner', 'dessert', 'snack', 'boisson');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('facile', 'moyen', 'difficile');

-- CreateEnum
CREATE TYPE "RecipeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "ScamReportReason" AS ENUM ('fraud', 'fake_product', 'harassment', 'suspicious_behavior', 'other');

-- CreateEnum
CREATE TYPE "ScamReportReportedEntityType" AS ENUM ('product', 'store', 'user', 'message');

-- CreateEnum
CREATE TYPE "ScamReportStatus" AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "ShoppingListRecurrencePeriod" AS ENUM ('weekly', 'biweekly', 'monthly');

-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('draft', 'active', 'completed');

-- CreateEnum
CREATE TYPE "SocialPostPostType" AS ENUM ('savings', 'recipe', 'tip', 'challenge', 'deal', 'achievement', 'question');

-- CreateEnum
CREATE TYPE "SponsoredCampaignCampaignType" AS ENUM ('product_sponsorship', 'category_sponsorship', 'banner_ad', 'promoted_post');

-- CreateEnum
CREATE TYPE "SponsoredCampaignStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "StockMovementMovementType" AS ENUM ('in', 'out', 'adjustment', 'return', 'waste');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('pending', 'verified', 'rejected', 'suspended');

-- CreateEnum
CREATE TYPE "UserBackofficeRole" AS ENUM ('none', 'operator', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "UserEcoLevel" AS ENUM ('debutant', 'engage', 'expert', 'ambassadeur', 'heros');

-- CreateEnum
CREATE TYPE "UserInteractionInteractionType" AS ENUM ('view', 'like', 'share', 'save', 'purchase', 'click');

-- CreateEnum
CREATE TYPE "UserInteractionItemType" AS ENUM ('product', 'recipe', 'tip', 'challenge', 'post');

-- CreateEnum
CREATE TYPE "UserLoyaltyTier" AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "UserVerificationStatus" AS ENUM ('unverified', 'pending', 'verified', 'premium_verified');

-- CreateEnum
CREATE TYPE "ZeroWasteTipCategory" AS ENUM ('conservation', 'cuisine', 'achat', 'compost', 'reutilisation', 'autre');

-- CreateEnum
CREATE TYPE "ZeroWasteTipStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor_email" TEXT,
    "actor_role" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entity_name" TEXT,
    "entity_id" TEXT,
    "description" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "provider_ref" TEXT,
    "failure_reason" TEXT,
    "raw_callback" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobLock" (
    "name" TEXT NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "last_result" JSONB,

    CONSTRAINT "JobLock_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "BasketReview" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "basket_id" TEXT,
    "basket_name" TEXT,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "rating_overall" DOUBLE PRECISION NOT NULL,
    "rating_quality" DOUBLE PRECISION,
    "rating_freshness" DOUBLE PRECISION,
    "rating_quantity" INTEGER,
    "comment" TEXT,
    "tags" TEXT[],
    "would_recommend" BOOLEAN,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasketReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandPartnership" (
    "id" TEXT NOT NULL,
    "brand_name" TEXT NOT NULL,
    "brand_logo_url" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT,
    "partnership_status" "BrandPartnershipPartnershipStatus" NOT NULL DEFAULT 'pending',
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "monthly_budget" DOUBLE PRECISION,
    "sponsored_products" TEXT[],
    "sponsored_categories" TEXT[],
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_sales_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_commissions_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandPartnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMetrics" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "campaign_name" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "products_sold" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customer_segments" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartItem" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "product_image" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "original_price" DOUBLE PRECISION,
    "store_name" TEXT,
    "expiration_date" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "challenge_type" "ChallengeChallengeType" NOT NULL DEFAULT 'weekly',
    "goal_type" "ChallengeGoalType" NOT NULL,
    "goal_value" DOUBLE PRECISION NOT NULL,
    "reward_badge" TEXT,
    "reward_points" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3) NOT NULL,
    "participants_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_name" TEXT,
    "sender_avatar" TEXT,
    "content" TEXT NOT NULL,
    "message_type" "ChatMessageMessageType" NOT NULL DEFAULT 'text',
    "attachment_url" TEXT,
    "reactions" JSONB,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChatRoomType" NOT NULL DEFAULT 'public',
    "category" "ChatRoomCategory" NOT NULL DEFAULT 'general',
    "icon" TEXT,
    "members_count" INTEGER NOT NULL DEFAULT 0,
    "last_message" TEXT,
    "last_message_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickCollectBasket" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT NOT NULL,
    "store_address" TEXT,
    "basket_type" "ClickCollectBasketBasketType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "original_price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "products" JSONB[],
    "pickup_date" TIMESTAMP(3) NOT NULL,
    "pickup_slots" TEXT[],
    "category" TEXT,
    "allergens" TEXT[],
    "weight_kg" DOUBLE PRECISION,
    "co2_saved_kg" DOUBLE PRECISION,
    "status" "ClickCollectBasketStatus" NOT NULL DEFAULT 'active',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClickCollectBasket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickCollectReservation" (
    "id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "basket_id" TEXT NOT NULL,
    "basket_name" TEXT,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "store_address" TEXT,
    "pickup_date" TIMESTAMP(3) NOT NULL,
    "pickup_slot" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "savings_amount" DOUBLE PRECISION,
    "payment_method" "ClickCollectReservationPaymentMethod" NOT NULL,
    "payment_status" "ClickCollectReservationPaymentStatus" NOT NULL DEFAULT 'pending',
    "confirmation_code" TEXT,
    "status" "ClickCollectReservationStatus" NOT NULL DEFAULT 'reserved',
    "qr_code_url" TEXT,
    "notes" TEXT,
    "co2_saved_kg" DOUBLE PRECISION,
    "confirmation_code_hash" TEXT,
    "payment_reference" TEXT,
    "collected_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClickCollectReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_name" TEXT,
    "content" TEXT NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionTransaction" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "brand_name" TEXT,
    "campaign_id" TEXT,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "sale_amount" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION,
    "status" "CommissionTransactionStatus" NOT NULL DEFAULT 'pending',
    "transaction_date" TIMESTAMP(3),
    "payment_date" TIMESTAMP(3),
    "customer_email" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'FIXED',
    "value" DOUBLE PRECISION NOT NULL,
    "min_cart_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_to" TIMESTAMP(3),
    "points_cost" INTEGER,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "redeemed_order_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSegment" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "segment_type" "CustomerSegmentSegmentType" NOT NULL,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_purchase_date" TIMESTAMP(3),
    "days_since_last_purchase" INTEGER NOT NULL DEFAULT 0,
    "favorite_categories" TEXT[],
    "preferred_stores" TEXT[],
    "price_sensitivity" "CustomerSegmentPriceSensitivity",
    "engagement_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "churn_risk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lifetime_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommended_offers" TEXT[],
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardPreference" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "dashboard_type" "DashboardPreferenceDashboardType" NOT NULL,
    "visible_widgets" TEXT[],
    "widget_order" JSONB[],
    "alerts_config" JSONB,
    "chart_preferences" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryAddress" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "label" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Cameroun',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_billing" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryRoute" (
    "id" TEXT NOT NULL,
    "driver_email" TEXT NOT NULL,
    "driver_name" TEXT,
    "route_name" TEXT,
    "order_ids" TEXT[],
    "stops" JSONB[],
    "total_distance_km" DOUBLE PRECISION,
    "estimated_duration_minutes" INTEGER,
    "status" "DeliveryRouteStatus" NOT NULL DEFAULT 'planned',
    "start_time" TEXT,
    "end_time" TEXT,
    "optimization_score" DOUBLE PRECISION,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigitalReceipt" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "store_id" TEXT,
    "store_name" TEXT NOT NULL,
    "receipt_number" TEXT,
    "receipt_image_url" TEXT,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "items" JSONB[],
    "total_amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "cashback_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "cashback_status" "DigitalReceiptCashbackStatus" NOT NULL DEFAULT 'pending',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "experience_type" "ExperienceExperienceType" NOT NULL DEFAULT 'workshop',
    "points_required" INTEGER NOT NULL,
    "duration_minutes" INTEGER,
    "max_participants" INTEGER NOT NULL,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "event_date" TIMESTAMP(3) NOT NULL,
    "event_time" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tier_required" "ExperienceTierRequired" NOT NULL DEFAULT 'bronze',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceBooking" (
    "id" TEXT NOT NULL,
    "experience_id" TEXT NOT NULL,
    "experience_title" TEXT,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "user_phone" TEXT,
    "status" "ExperienceBookingStatus" NOT NULL DEFAULT 'pending',
    "points_spent" INTEGER NOT NULL,
    "event_date" TIMESTAMP(3),
    "event_time" TEXT,
    "store_name" TEXT,
    "reminder_sent" BOOLEAN NOT NULL DEFAULT false,
    "confirmation_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "product_image" TEXT,
    "store_name" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityVerification" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "verification_type" "IdentityVerificationVerificationType" NOT NULL,
    "document_url" TEXT,
    "status" "IdentityVerificationStatus" NOT NULL DEFAULT 'pending',
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "reviewer_notes" TEXT,
    "verification_level" "IdentityVerificationVerificationLevel" NOT NULL DEFAULT 'basic',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "points_required" INTEGER NOT NULL,
    "reward_type" "LoyaltyRewardRewardType" NOT NULL,
    "reward_value" DOUBLE PRECISION,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tier_required" "LoyaltyRewardTierRequired" NOT NULL DEFAULT 'bronze',
    "stock" INTEGER,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "source" "LoyaltyTransactionSource" NOT NULL,
    "description" TEXT,
    "order_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "sender_name" TEXT,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "conversation_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'system',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "image_url" TEXT,
    "data" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "items" JSONB[],
    "total_amount" DOUBLE PRECISION NOT NULL,
    "total_savings" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "OrderPaymentMethod",
    "delivery_type" "OrderDeliveryType" NOT NULL DEFAULT 'pickup',
    "delivery_address" TEXT,
    "store_id" TEXT,
    "store_name" TEXT,
    "qr_scanned_at" TIMESTAMP(3),
    "qr_scan_attempts" INTEGER NOT NULL DEFAULT 0,
    "delivery_proof" JSONB,
    "delivered_at" TIMESTAMP(3),
    "delivered_by" TEXT,
    "order_number" TEXT,
    "subtotal_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coupon_code" TEXT,
    "payment_status" "OrderPaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_reference" TEXT,
    "pickup_token_hash" TEXT,
    "co2_saved_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerChallenge" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "goal_type" "PartnerChallengeGoalType" NOT NULL DEFAULT 'purchases',
    "goal_value" DOUBLE PRECISION NOT NULL,
    "reward_type" "PartnerChallengeRewardType" NOT NULL DEFAULT 'points',
    "reward_value" DOUBLE PRECISION,
    "reward_description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "participants_count" INTEGER NOT NULL DEFAULT 0,
    "completions_count" INTEGER NOT NULL DEFAULT 0,
    "total_revenue_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerStatusHistory" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "previous_status" "PartnerStatusHistoryPreviousStatus" NOT NULL,
    "new_status" "PartnerStatusHistoryNewStatus" NOT NULL,
    "changed_by" TEXT NOT NULL,
    "changed_by_name" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PickupRequest" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT,
    "store_id" TEXT NOT NULL,
    "store_name" TEXT,
    "store_address" TEXT,
    "pickup_time_slot" TEXT,
    "pickup_date" TIMESTAMP(3) NOT NULL,
    "status" "PickupRequestStatus" NOT NULL DEFAULT 'requested',
    "confirmation_code" TEXT,
    "items" JSONB[],
    "total_amount" DOUBLE PRECISION,
    "special_instructions" TEXT,
    "ready_at" TIMESTAMP(3),
    "picked_up_at" TIMESTAMP(3),
    "qr_code_url" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceComparison" (
    "id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "barcode" TEXT,
    "brand" TEXT,
    "stores_prices" JSONB[],
    "best_deal" JSONB,
    "category" TEXT,
    "last_updated" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "original_price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL,
    "ai_suggested_price" DOUBLE PRECISION,
    "category" "ProductCategory" NOT NULL,
    "expiration_date" TIMESTAMP(3) NOT NULL,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "images" TEXT[],
    "store_id" TEXT,
    "store_name" TEXT NOT NULL,
    "store_location" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "urgency_level" "ProductUrgencyLevel" NOT NULL DEFAULT 'normal',
    "freshness_score" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "weight_unit" "ProductWeightUnit",
    "brand" TEXT,
    "barcode" TEXT,
    "nutritional_info" JSONB,
    "allergens" TEXT[],
    "tags" TEXT[],
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "favorites_count" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviews_count" INTEGER NOT NULL DEFAULT 0,
    "is_bundle" BOOLEAN NOT NULL DEFAULT false,
    "bundle_products" TEXT[],
    "co2_saved" DOUBLE PRECISION,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductBatch" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "store_id" TEXT,
    "batch_number" TEXT,
    "quantity" INTEGER NOT NULL,
    "quantity_sold" INTEGER NOT NULL DEFAULT 0,
    "expiration_date" TIMESTAMP(3) NOT NULL,
    "purchase_price" DOUBLE PRECISION,
    "status" "ProductBatchStatus" NOT NULL DEFAULT 'active',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT,
    "variant_name" TEXT NOT NULL,
    "attributes" JSONB,
    "sku" TEXT,
    "price_adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity_available" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "PromotionDiscountType" NOT NULL DEFAULT 'percentage',
    "discount_value" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applicable_products" TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRule" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger_type" "PromotionRuleTriggerType" NOT NULL,
    "conditions" JSONB,
    "discount_action" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "applies_to" "PromotionRuleAppliesTo" NOT NULL DEFAULT 'all_products',
    "target_products" TEXT[],
    "target_categories" TEXT[],
    "execution_count" INTEGER NOT NULL DEFAULT 0,
    "last_executed" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "ingredients" JSONB[],
    "steps" TEXT[],
    "prep_time" DOUBLE PRECISION,
    "cook_time" DOUBLE PRECISION,
    "servings" INTEGER,
    "difficulty" "RecipeDifficulty",
    "estimated_cost" DOUBLE PRECISION,
    "savings_potential" DOUBLE PRECISION,
    "category" "RecipeCategory",
    "tags" TEXT[],
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "saves_count" INTEGER NOT NULL DEFAULT 0,
    "status" "RecipeStatus" NOT NULL DEFAULT 'pending',
    "author_email" TEXT,
    "author_name" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeRating" (
    "id" TEXT NOT NULL,
    "recipe_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "image_url" TEXT,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "user_name" TEXT,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "image_url" TEXT,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "search_name" TEXT NOT NULL,
    "search_query" TEXT NOT NULL,
    "filters" JSONB,
    "entity_types" TEXT[],
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScamReport" (
    "id" TEXT NOT NULL,
    "reporter_email" TEXT NOT NULL,
    "reported_entity_type" "ScamReportReportedEntityType" NOT NULL,
    "reported_entity_id" TEXT NOT NULL,
    "reason" "ScamReportReason" NOT NULL,
    "description" TEXT,
    "status" "ScamReportStatus" NOT NULL DEFAULT 'pending',
    "evidence_url" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScamReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "user_email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB[],
    "estimated_budget" DOUBLE PRECISION,
    "actual_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stores_suggested" TEXT[],
    "savings_potential" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'active',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_period" "ShoppingListRecurrencePeriod",
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_name" TEXT,
    "author_avatar" TEXT,
    "author_eco_level" TEXT,
    "content" TEXT NOT NULL,
    "image_url" TEXT,
    "post_type" "SocialPostPostType" NOT NULL DEFAULT 'savings',
    "savings_amount" DOUBLE PRECISION,
    "waste_avoided_kg" DOUBLE PRECISION,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "shares_count" INTEGER NOT NULL DEFAULT 0,
    "liked_by" TEXT[],
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "related_products" TEXT[],
    "store_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsoredCampaign" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "brand_id" TEXT NOT NULL,
    "brand_name" TEXT,
    "campaign_name" TEXT NOT NULL,
    "campaign_type" "SponsoredCampaignCampaignType" NOT NULL DEFAULT 'product_sponsorship',
    "target_products" TEXT[],
    "target_categories" TEXT[],
    "target_audience" JSONB,
    "budget" DOUBLE PRECISION NOT NULL,
    "spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "SponsoredCampaignStatus" NOT NULL DEFAULT 'draft',
    "ad_creative" JSONB,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "roi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ctr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsoredCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "movement_type" "StockMovementMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "user_email" TEXT,
    "notes" TEXT,
    "previous_quantity" INTEGER,
    "new_quantity" INTEGER,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "logo_url" TEXT,
    "is_partner" BOOLEAN NOT NULL DEFAULT true,
    "status" "StoreStatus" NOT NULL DEFAULT 'pending',
    "rating" DOUBLE PRECISION,
    "total_products_saved" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_revenue_recovered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_savings_generated" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "owner_email" TEXT,
    "opening_hours" TEXT,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "employee_emails" TEXT[],
    "employee_roles" JSONB,
    "stock_alert_settings" JSONB,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "password_hash" TEXT,
    "avatar_url" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "backoffice_role" "UserBackofficeRole" NOT NULL DEFAULT 'none',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "phone" TEXT,
    "city" TEXT,
    "address" TEXT,
    "is_partner" BOOLEAN NOT NULL DEFAULT false,
    "is_delivery_driver" BOOLEAN NOT NULL DEFAULT false,
    "store_id" TEXT,
    "total_savings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waste_avoided_kg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eco_level" "UserEcoLevel" NOT NULL DEFAULT 'debutant',
    "eco_points" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT[],
    "featured_badge" TEXT,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "loyalty_tier" "UserLoyaltyTier" NOT NULL DEFAULT 'bronze',
    "preferences" JSONB,
    "trust_score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "verification_status" "UserVerificationStatus" NOT NULL DEFAULT 'unverified',
    "reports_received" INTEGER NOT NULL DEFAULT 0,
    "reports_submitted" INTEGER NOT NULL DEFAULT 0,
    "successful_transactions" INTEGER NOT NULL DEFAULT 0,
    "account_age_days" INTEGER NOT NULL DEFAULT 0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referrals_count" INTEGER NOT NULL DEFAULT 0,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_public_profile" BOOLEAN NOT NULL DEFAULT true,
    "allow_messages" BOOLEAN NOT NULL DEFAULT true,
    "dietary_preferences" TEXT[],
    "allergens_to_avoid" TEXT[],
    "favorite_stores" TEXT[],
    "community_badges" TEXT[],
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserChallenge" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "current_progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_date" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInteraction" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "item_type" "UserInteractionItemType" NOT NULL,
    "item_id" TEXT NOT NULL,
    "interaction_type" "UserInteractionInteractionType" NOT NULL,
    "category" TEXT,
    "metadata" JSONB,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "user_email" TEXT NOT NULL,
    "favorite_categories" TEXT[],
    "budget_monthly" DOUBLE PRECISION,
    "max_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "preferred_stores" TEXT[],
    "notification_preferences" JSONB,
    "location" JSONB,
    "allergens_to_avoid" TEXT[],
    "dietary_preferences" TEXT[],
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZeroWasteTip" (
    "id" TEXT NOT NULL,
    "author_email" TEXT NOT NULL,
    "author_name" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" "ZeroWasteTipCategory" NOT NULL DEFAULT 'autre',
    "image_url" TEXT,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "saves_count" INTEGER NOT NULL DEFAULT 0,
    "liked_by" TEXT[],
    "status" "ZeroWasteTipStatus" NOT NULL DEFAULT 'pending',
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZeroWasteTip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_hash_key" ON "RefreshToken"("token_hash");

-- CreateIndex
CREATE INDEX "RefreshToken_user_email_idx" ON "RefreshToken"("user_email");

-- CreateIndex
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");

-- CreateIndex
CREATE INDEX "AuditLog_actor_email_idx" ON "AuditLog"("actor_email");

-- CreateIndex
CREATE INDEX "AuditLog_module_idx" ON "AuditLog"("module");

-- CreateIndex
CREATE INDEX "AuditLog_created_date_idx" ON "AuditLog"("created_date");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_reference_key" ON "PaymentIntent"("reference");

-- CreateIndex
CREATE INDEX "PaymentIntent_target_type_target_id_idx" ON "PaymentIntent"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "PaymentIntent_customer_email_idx" ON "PaymentIntent"("customer_email");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "BasketReview_reservation_id_idx" ON "BasketReview"("reservation_id");

-- CreateIndex
CREATE INDEX "BasketReview_basket_id_idx" ON "BasketReview"("basket_id");

-- CreateIndex
CREATE INDEX "BasketReview_store_id_idx" ON "BasketReview"("store_id");

-- CreateIndex
CREATE INDEX "BasketReview_customer_email_idx" ON "BasketReview"("customer_email");

-- CreateIndex
CREATE INDEX "BrandPartnership_contact_email_idx" ON "BrandPartnership"("contact_email");

-- CreateIndex
CREATE INDEX "CampaignMetrics_store_id_idx" ON "CampaignMetrics"("store_id");

-- CreateIndex
CREATE INDEX "CampaignMetrics_campaign_id_idx" ON "CampaignMetrics"("campaign_id");

-- CreateIndex
CREATE INDEX "CartItem_user_email_idx" ON "CartItem"("user_email");

-- CreateIndex
CREATE INDEX "CartItem_product_id_idx" ON "CartItem"("product_id");

-- CreateIndex
CREATE INDEX "CartItem_expiration_date_idx" ON "CartItem"("expiration_date");

-- CreateIndex
CREATE INDEX "ChatMessage_room_id_idx" ON "ChatMessage"("room_id");

-- CreateIndex
CREATE INDEX "ChatMessage_sender_email_idx" ON "ChatMessage"("sender_email");

-- CreateIndex
CREATE INDEX "ChatRoom_category_idx" ON "ChatRoom"("category");

-- CreateIndex
CREATE INDEX "ClickCollectBasket_store_id_idx" ON "ClickCollectBasket"("store_id");

-- CreateIndex
CREATE INDEX "ClickCollectBasket_pickup_date_idx" ON "ClickCollectBasket"("pickup_date");

-- CreateIndex
CREATE INDEX "ClickCollectBasket_category_idx" ON "ClickCollectBasket"("category");

-- CreateIndex
CREATE INDEX "ClickCollectBasket_status_idx" ON "ClickCollectBasket"("status");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_customer_email_idx" ON "ClickCollectReservation"("customer_email");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_basket_id_idx" ON "ClickCollectReservation"("basket_id");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_store_id_idx" ON "ClickCollectReservation"("store_id");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_pickup_date_idx" ON "ClickCollectReservation"("pickup_date");

-- CreateIndex
CREATE INDEX "ClickCollectReservation_status_idx" ON "ClickCollectReservation"("status");

-- CreateIndex
CREATE INDEX "Comment_post_id_idx" ON "Comment"("post_id");

-- CreateIndex
CREATE INDEX "Comment_author_email_idx" ON "Comment"("author_email");

-- CreateIndex
CREATE INDEX "CommissionTransaction_brand_id_idx" ON "CommissionTransaction"("brand_id");

-- CreateIndex
CREATE INDEX "CommissionTransaction_campaign_id_idx" ON "CommissionTransaction"("campaign_id");

-- CreateIndex
CREATE INDEX "CommissionTransaction_order_id_idx" ON "CommissionTransaction"("order_id");

-- CreateIndex
CREATE INDEX "CommissionTransaction_product_id_idx" ON "CommissionTransaction"("product_id");

-- CreateIndex
CREATE INDEX "CommissionTransaction_status_idx" ON "CommissionTransaction"("status");

-- CreateIndex
CREATE INDEX "CommissionTransaction_customer_email_idx" ON "CommissionTransaction"("customer_email");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_user_email_idx" ON "Coupon"("user_email");

-- CreateIndex
CREATE INDEX "Coupon_status_idx" ON "Coupon"("status");

-- CreateIndex
CREATE INDEX "Coupon_redeemed_order_id_idx" ON "Coupon"("redeemed_order_id");

-- CreateIndex
CREATE INDEX "CustomerSegment_user_email_idx" ON "CustomerSegment"("user_email");

-- CreateIndex
CREATE INDEX "DashboardPreference_user_email_idx" ON "DashboardPreference"("user_email");

-- CreateIndex
CREATE INDEX "DeliveryAddress_user_email_idx" ON "DeliveryAddress"("user_email");

-- CreateIndex
CREATE INDEX "DeliveryRoute_driver_email_idx" ON "DeliveryRoute"("driver_email");

-- CreateIndex
CREATE INDEX "DeliveryRoute_status_idx" ON "DeliveryRoute"("status");

-- CreateIndex
CREATE INDEX "DigitalReceipt_user_email_idx" ON "DigitalReceipt"("user_email");

-- CreateIndex
CREATE INDEX "DigitalReceipt_store_id_idx" ON "DigitalReceipt"("store_id");

-- CreateIndex
CREATE INDEX "Experience_store_id_idx" ON "Experience"("store_id");

-- CreateIndex
CREATE INDEX "ExperienceBooking_experience_id_idx" ON "ExperienceBooking"("experience_id");

-- CreateIndex
CREATE INDEX "ExperienceBooking_user_email_idx" ON "ExperienceBooking"("user_email");

-- CreateIndex
CREATE INDEX "ExperienceBooking_status_idx" ON "ExperienceBooking"("status");

-- CreateIndex
CREATE INDEX "Favorite_user_email_idx" ON "Favorite"("user_email");

-- CreateIndex
CREATE INDEX "Favorite_product_id_idx" ON "Favorite"("product_id");

-- CreateIndex
CREATE INDEX "IdentityVerification_user_email_idx" ON "IdentityVerification"("user_email");

-- CreateIndex
CREATE INDEX "IdentityVerification_status_idx" ON "IdentityVerification"("status");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_user_email_idx" ON "LoyaltyTransaction"("user_email");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_order_id_idx" ON "LoyaltyTransaction"("order_id");

-- CreateIndex
CREATE INDEX "Message_sender_email_idx" ON "Message"("sender_email");

-- CreateIndex
CREATE INDEX "Message_recipient_email_idx" ON "Message"("recipient_email");

-- CreateIndex
CREATE INDEX "Message_is_read_idx" ON "Message"("is_read");

-- CreateIndex
CREATE INDEX "Message_conversation_id_idx" ON "Message"("conversation_id");

-- CreateIndex
CREATE INDEX "Notification_user_email_idx" ON "Notification"("user_email");

-- CreateIndex
CREATE INDEX "Notification_is_read_idx" ON "Notification"("is_read");

-- CreateIndex
CREATE INDEX "Order_customer_email_idx" ON "Order"("customer_email");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_store_id_idx" ON "Order"("store_id");

-- CreateIndex
CREATE INDEX "PartnerChallenge_store_id_idx" ON "PartnerChallenge"("store_id");

-- CreateIndex
CREATE INDEX "PartnerStatusHistory_store_id_idx" ON "PartnerStatusHistory"("store_id");

-- CreateIndex
CREATE INDEX "PickupRequest_order_id_idx" ON "PickupRequest"("order_id");

-- CreateIndex
CREATE INDEX "PickupRequest_customer_email_idx" ON "PickupRequest"("customer_email");

-- CreateIndex
CREATE INDEX "PickupRequest_store_id_idx" ON "PickupRequest"("store_id");

-- CreateIndex
CREATE INDEX "PickupRequest_pickup_date_idx" ON "PickupRequest"("pickup_date");

-- CreateIndex
CREATE INDEX "PickupRequest_status_idx" ON "PickupRequest"("status");

-- CreateIndex
CREATE INDEX "PriceComparison_category_idx" ON "PriceComparison"("category");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_expiration_date_idx" ON "Product"("expiration_date");

-- CreateIndex
CREATE INDEX "Product_store_id_idx" ON "Product"("store_id");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "ProductBatch_product_id_idx" ON "ProductBatch"("product_id");

-- CreateIndex
CREATE INDEX "ProductBatch_store_id_idx" ON "ProductBatch"("store_id");

-- CreateIndex
CREATE INDEX "ProductBatch_expiration_date_idx" ON "ProductBatch"("expiration_date");

-- CreateIndex
CREATE INDEX "ProductBatch_status_idx" ON "ProductBatch"("status");

-- CreateIndex
CREATE INDEX "ProductVariant_product_id_idx" ON "ProductVariant"("product_id");

-- CreateIndex
CREATE INDEX "Promotion_store_id_idx" ON "Promotion"("store_id");

-- CreateIndex
CREATE INDEX "PromotionRule_store_id_idx" ON "PromotionRule"("store_id");

-- CreateIndex
CREATE INDEX "Recipe_category_idx" ON "Recipe"("category");

-- CreateIndex
CREATE INDEX "Recipe_status_idx" ON "Recipe"("status");

-- CreateIndex
CREATE INDEX "Recipe_author_email_idx" ON "Recipe"("author_email");

-- CreateIndex
CREATE INDEX "RecipeRating_recipe_id_idx" ON "RecipeRating"("recipe_id");

-- CreateIndex
CREATE INDEX "RecipeRating_user_email_idx" ON "RecipeRating"("user_email");

-- CreateIndex
CREATE INDEX "Review_product_id_idx" ON "Review"("product_id");

-- CreateIndex
CREATE INDEX "Review_user_email_idx" ON "Review"("user_email");

-- CreateIndex
CREATE INDEX "SavedSearch_user_email_idx" ON "SavedSearch"("user_email");

-- CreateIndex
CREATE INDEX "ScamReport_reporter_email_idx" ON "ScamReport"("reporter_email");

-- CreateIndex
CREATE INDEX "ScamReport_reported_entity_id_idx" ON "ScamReport"("reported_entity_id");

-- CreateIndex
CREATE INDEX "ScamReport_status_idx" ON "ScamReport"("status");

-- CreateIndex
CREATE INDEX "ShoppingList_user_email_idx" ON "ShoppingList"("user_email");

-- CreateIndex
CREATE INDEX "ShoppingList_status_idx" ON "ShoppingList"("status");

-- CreateIndex
CREATE INDEX "SocialPost_author_email_idx" ON "SocialPost"("author_email");

-- CreateIndex
CREATE INDEX "SocialPost_store_id_idx" ON "SocialPost"("store_id");

-- CreateIndex
CREATE INDEX "SponsoredCampaign_brand_id_idx" ON "SponsoredCampaign"("brand_id");

-- CreateIndex
CREATE INDEX "SponsoredCampaign_status_idx" ON "SponsoredCampaign"("status");

-- CreateIndex
CREATE INDEX "StockMovement_product_id_idx" ON "StockMovement"("product_id");

-- CreateIndex
CREATE INDEX "StockMovement_variant_id_idx" ON "StockMovement"("variant_id");

-- CreateIndex
CREATE INDEX "StockMovement_user_email_idx" ON "StockMovement"("user_email");

-- CreateIndex
CREATE INDEX "Store_status_idx" ON "Store"("status");

-- CreateIndex
CREATE INDEX "Store_owner_email_idx" ON "Store"("owner_email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_store_id_idx" ON "User"("store_id");

-- CreateIndex
CREATE INDEX "UserChallenge_user_email_idx" ON "UserChallenge"("user_email");

-- CreateIndex
CREATE INDEX "UserChallenge_challenge_id_idx" ON "UserChallenge"("challenge_id");

-- CreateIndex
CREATE INDEX "UserInteraction_user_email_idx" ON "UserInteraction"("user_email");

-- CreateIndex
CREATE INDEX "UserInteraction_item_id_idx" ON "UserInteraction"("item_id");

-- CreateIndex
CREATE INDEX "UserInteraction_category_idx" ON "UserInteraction"("category");

-- CreateIndex
CREATE INDEX "UserPreference_user_email_idx" ON "UserPreference"("user_email");

-- CreateIndex
CREATE INDEX "ZeroWasteTip_author_email_idx" ON "ZeroWasteTip"("author_email");

-- CreateIndex
CREATE INDEX "ZeroWasteTip_category_idx" ON "ZeroWasteTip"("category");

-- CreateIndex
CREATE INDEX "ZeroWasteTip_status_idx" ON "ZeroWasteTip"("status");
