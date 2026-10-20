-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('CUSTOMER', 'HOTEL_STAFF', 'HOTEL_PARTNER', 'ADMIN', 'PLATFORM_MANAGER');

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "verification_token_type" AS ENUM ('EMAIL_VERIFY', 'PASSWORD_RESET', 'ACCOUNT_INVITE');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "partner_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "hotel_status" AS ENUM ('DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');

-- CreateEnum
CREATE TYPE "verification_request_type" AS ENUM ('INITIAL', 'UPDATE', 'RENEWAL');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('BUSINESS_LICENSE', 'SECURITY_CERTIFICATE', 'FIRE_SAFETY', 'ID_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "room_status" AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "calendar_status" AS ENUM ('AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('VNPAY', 'SEPAY', 'WALLET', 'CASH', 'MIXED');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "day_of_week" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "loyalty_tier" AS ENUM ('MEMBER', 'SILVER', 'GOLD', 'PLATINUM');

-- CreateEnum
CREATE TYPE "wallet_txn_type" AS ENUM ('BOOKING_PAYMENT', 'COMMISSION', 'PAYOUT', 'REFUND', 'TOPUP', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "conversation_channel" AS ENUM ('WEB', 'MOBILE');

-- CreateEnum
CREATE TYPE "conversation_status" AS ENUM ('OPEN', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('USER', 'ASSISTANT', 'STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('BOOKING', 'PAYMENT', 'PROMOTION', 'REVIEW', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "interaction_type" AS ENUM ('VIEW', 'SEARCH', 'CLICK', 'WISHLIST', 'BOOK');

-- CreateEnum
CREATE TYPE "content_type" AS ENUM ('POST', 'BLOG', 'CAPTION', 'PROMOTION');

-- CreateEnum
CREATE TYPE "content_status" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "schedule_status" AS ENUM ('SCHEDULED', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "social_platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "violation_severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "violation_status" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "model_run_status" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "admin" (
    "admin_id" UUID NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "ai_config" (
    "ai_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "hotel_partner_id" UUID NOT NULL,
    "config_key" VARCHAR(100) NOT NULL,
    "config_value" TEXT NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ai_config_pkey" PRIMARY KEY ("ai_config_id")
);

-- CreateTable
CREATE TABLE "ai_function_call" (
    "ai_function_call_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "function_name" VARCHAR(100) NOT NULL,
    "arguments" JSONB,
    "result" JSONB,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_function_call_pkey" PRIMARY KEY ("ai_function_call_id")
);

-- CreateTable
CREATE TABLE "amenity" (
    "amenity_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(100),
    "category" VARCHAR(50) NOT NULL,

    CONSTRAINT "amenity_pkey" PRIMARY KEY ("amenity_id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "audit_log_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "hotel_staff_id" UUID,
    "hotel_partner_id" UUID,
    "admin_id" UUID,
    "platform_manager_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100),
    "entity_id" UUID,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("audit_log_id")
);

-- CreateTable
CREATE TABLE "bed_type" (
    "bed_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "capacity" INTEGER,

    CONSTRAINT "bed_type_pkey" PRIMARY KEY ("bed_type_id")
);

-- CreateTable
CREATE TABLE "booking" (
    "booking_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "hotel_staff_id" UUID,
    "voucher_id" UUID,
    "promotion_id" UUID,
    "loyalty_program_id" UUID,
    "recommendation_id" UUID,
    "check_in_date" DATE NOT NULL,
    "check_out_date" DATE NOT NULL,
    "num_guests" INTEGER,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "special_requests" TEXT,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "content_embedding" (
    "content_embedding_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "knowledge_article_id" UUID,
    "chunk_index" INTEGER,
    "chunk_text" TEXT NOT NULL,
    "embedding" vector(768),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_embedding_pkey" PRIMARY KEY ("content_embedding_id")
);

-- CreateTable
CREATE TABLE "content_metric" (
    "content_metric_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "content_schedule_id" UUID NOT NULL,
    "platform" "social_platform" NOT NULL,
    "views" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "shares" INTEGER NOT NULL,
    "comments" INTEGER NOT NULL,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_metric_pkey" PRIMARY KEY ("content_metric_id")
);

-- CreateTable
CREATE TABLE "content_schedule" (
    "content_schedule_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "marketing_content_id" UUID NOT NULL,
    "social_account_id" UUID NOT NULL,
    "scheduled_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "status" "schedule_status" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "content_schedule_pkey" PRIMARY KEY ("content_schedule_id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "conversation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "hotel_staff_id" UUID,
    "booking_id" UUID,
    "hotel_id" UUID,
    "channel" "conversation_channel" NOT NULL,
    "status" "conversation_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "customer" (
    "customer_id" UUID NOT NULL,
    "date_of_birth" DATE,
    "gender" "gender",
    "nationality" VARCHAR(100),

    CONSTRAINT "customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "customer_preference" (
    "customer_preference_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "preference_key" VARCHAR(100) NOT NULL,
    "preference_value" TEXT NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customer_preference_pkey" PRIMARY KEY ("customer_preference_id")
);

-- CreateTable
CREATE TABLE "hotel" (
    "hotel_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_partner_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "star_rating" INTEGER,
    "phone" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "website" VARCHAR(500),
    "check_in_time" TIME(6),
    "check_out_time" TIME(6),
    "status" "hotel_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_pkey" PRIMARY KEY ("hotel_id")
);

-- CreateTable
CREATE TABLE "hotel_amenity" (
    "hotel_amenity_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,

    CONSTRAINT "hotel_amenity_pkey" PRIMARY KEY ("hotel_amenity_id")
);

-- CreateTable
CREATE TABLE "hotel_partner" (
    "hotel_partner_id" UUID NOT NULL,
    "partner_name" VARCHAR(255) NOT NULL,
    "contact_email" VARCHAR(255) NOT NULL,
    "contact_phone" VARCHAR(20) NOT NULL,
    "business_license" VARCHAR(100),
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "status" "partner_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_partner_pkey" PRIMARY KEY ("hotel_partner_id")
);

-- CreateTable
CREATE TABLE "hotel_properties" (
    "hotel_property_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "verification_request_id" UUID,
    "verification_document_id" UUID NOT NULL,
    "property_key" VARCHAR(100) NOT NULL,
    "property_value" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_properties_pkey" PRIMARY KEY ("hotel_property_id")
);

-- CreateTable
CREATE TABLE "hotel_room_config" (
    "hotel_room_config_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "total_rooms" INTEGER NOT NULL,
    "base_price" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_room_config_pkey" PRIMARY KEY ("hotel_room_config_id")
);

-- CreateTable
CREATE TABLE "hotel_staff" (
    "hotel_staff_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "position" VARCHAR(50) NOT NULL,

    CONSTRAINT "hotel_staff_pkey" PRIMARY KEY ("hotel_staff_id")
);

-- CreateTable
CREATE TABLE "hotel_verification_document" (
    "verification_document_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_request_id" UUID NOT NULL,
    "parent_document_id" UUID,
    "document_type" "document_type" NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_verification_document_pkey" PRIMARY KEY ("verification_document_id")
);

-- CreateTable
CREATE TABLE "hotel_verification_request" (
    "verification_request_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_manager_id" UUID NOT NULL,
    "status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "request_type" "verification_request_type" NOT NULL,
    "notes" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_verification_request_pkey" PRIMARY KEY ("verification_request_id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "invoice_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "invoice_number" VARCHAR(50) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "tax_amount" DECIMAL(14,2) NOT NULL,
    "discount_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "payment_method" "payment_method" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'UNPAID',
    "vnpay_txn_ref" VARCHAR(100),
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "knowledge_article" (
    "knowledge_article_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "knowledge_category_id" UUID NOT NULL,
    "hotel_id" UUID,
    "title" VARCHAR(255),
    "content" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "knowledge_article_pkey" PRIMARY KEY ("knowledge_article_id")
);

-- CreateTable
CREATE TABLE "knowledge_category" (
    "knowledge_category_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "sort_order" INTEGER,

    CONSTRAINT "knowledge_category_pkey" PRIMARY KEY ("knowledge_category_id")
);

-- CreateTable
CREATE TABLE "loyalty_account" (
    "loyalty_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "loyalty_program_id" UUID NOT NULL,
    "points_balance" INTEGER NOT NULL DEFAULT 0,
    "tier" "loyalty_tier",
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "loyalty_account_pkey" PRIMARY KEY ("loyalty_account_id")
);

-- CreateTable
CREATE TABLE "loyalty_program" (
    "loyalty_program_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "points_per_currency" DECIMAL(8,4) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_program_pkey" PRIMARY KEY ("loyalty_program_id")
);

-- CreateTable
CREATE TABLE "marketing_content" (
    "marketing_content_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "hotel_staff_id" UUID,
    "title" VARCHAR(255),
    "body" TEXT NOT NULL,
    "media_url" VARCHAR(500),
    "content_type" "content_type" NOT NULL,
    "status" "content_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_content_pkey" PRIMARY KEY ("marketing_content_id")
);

-- CreateTable
CREATE TABLE "message" (
    "message_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" "message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "model_run" (
    "model_run_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "algorithm" VARCHAR(50) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "rmse" DECIMAL(6,4),
    "mae" DECIMAL(6,4),
    "k" INTEGER,
    "relevance_threshold" DECIMAL(3,1),
    "precision_at_k" DECIMAL(6,4),
    "recall_at_k" DECIMAL(6,4),
    "ndcg_at_k" DECIMAL(6,4),
    "coldstart_coverage" DECIMAL(6,4),
    "hyperparameters" JSONB,
    "train_cutoff_at" TIMESTAMPTZ(6),
    "status" "model_run_status" NOT NULL DEFAULT 'RUNNING',
    "started_at" TIMESTAMPTZ(6) NOT NULL,
    "finished_at" TIMESTAMPTZ(6),

    CONSTRAINT "model_run_pkey" PRIMARY KEY ("model_run_id")
);

-- CreateTable
CREATE TABLE "notification" (
    "notification_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_account_id" UUID NOT NULL,
    "title" VARCHAR(255),
    "message" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "platform_manager" (
    "platform_manager_id" UUID NOT NULL,
    "department" VARCHAR(100),
    "permissions" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_manager_pkey" PRIMARY KEY ("platform_manager_id")
);

-- CreateTable
CREATE TABLE "policy_violation" (
    "policy_violation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "platform_manager_id" UUID,
    "hotel_partner_id" UUID,
    "violation_type" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "severity" "violation_severity" NOT NULL,
    "status" "violation_status" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "policy_violation_pkey" PRIMARY KEY ("policy_violation_id")
);

-- CreateTable
CREATE TABLE "price" (
    "price_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "room_id" UUID,
    "name" VARCHAR(100) NOT NULL,
    "price_per_night" DECIMAL(14,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "valid_from" DATE,
    "valid_to" DATE,
    "day_of_week" "day_of_week",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_pkey" PRIMARY KEY ("price_id")
);

-- CreateTable
CREATE TABLE "promotion" (
    "promotion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" DECIMAL(14,2) NOT NULL,
    "min_booking_amount" DECIMAL(14,2),
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "valid_from" DATE,
    "valid_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_pkey" PRIMARY KEY ("promotion_id")
);

-- CreateTable
CREATE TABLE "rating_criterion" (
    "rating_criterion_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "weight" DECIMAL(3,2) NOT NULL,

    CONSTRAINT "rating_criterion_pkey" PRIMARY KEY ("rating_criterion_id")
);

-- CreateTable
CREATE TABLE "rating_prediction" (
    "rating_prediction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "model_run_id" UUID NOT NULL,
    "rating_criterion_id" UUID NOT NULL,
    "predicted_score" DECIMAL(5,3) NOT NULL,
    "confidence" DECIMAL(5,3),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rating_prediction_pkey" PRIMARY KEY ("rating_prediction_id")
);

-- CreateTable
CREATE TABLE "recommendation" (
    "recommendation_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "hotel_id" UUID,
    "model_run_id" UUID NOT NULL,
    "room_type_id" UUID,
    "score" DECIMAL(5,3) NOT NULL,
    "rank" INTEGER,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_pkey" PRIMARY KEY ("recommendation_id")
);

-- CreateTable
CREATE TABLE "review" (
    "review_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "overall_rating" DECIMAL(3,1) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "room" (
    "room_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "room_number" VARCHAR(20) NOT NULL,
    "floor" INTEGER,
    "status" "room_status" NOT NULL DEFAULT 'AVAILABLE',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_pkey" PRIMARY KEY ("room_id")
);

-- CreateTable
CREATE TABLE "room_calendars" (
    "room_calendar_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "booking_id" UUID,
    "date" DATE NOT NULL,
    "status" "calendar_status" NOT NULL DEFAULT 'AVAILABLE',
    "hold_expires_at" TIMESTAMPTZ(6),
    "price_override" DECIMAL(14,2),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_calendars_pkey" PRIMARY KEY ("room_calendar_id")
);

-- CreateTable
CREATE TABLE "room_image" (
    "room_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(255),
    "sort_order" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_image_pkey" PRIMARY KEY ("room_image_id")
);

-- CreateTable
CREATE TABLE "room_type" (
    "room_type_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "max_occupancy" INTEGER NOT NULL,
    "base_area_sqm" DECIMAL(6,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_type_pkey" PRIMARY KEY ("room_type_id")
);

-- CreateTable
CREATE TABLE "room_type_amenity" (
    "room_type_amenity_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "amenity_id" UUID NOT NULL,

    CONSTRAINT "room_type_amenity_pkey" PRIMARY KEY ("room_type_amenity_id")
);

-- CreateTable
CREATE TABLE "room_type_bed" (
    "room_type_bed_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "bed_type_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "room_type_bed_pkey" PRIMARY KEY ("room_type_bed_id")
);

-- CreateTable
CREATE TABLE "social_account" (
    "social_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "platform" "social_platform" NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_account_pkey" PRIMARY KEY ("social_account_id")
);

-- CreateTable
CREATE TABLE "user_account" (
    "user_account_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "role" "user_role" NOT NULL,
    "status" "account_status" NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(6),
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_account_pkey" PRIMARY KEY ("user_account_id")
);

-- CreateTable
CREATE TABLE "auth_session" (
    "auth_session_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_account_id" UUID NOT NULL,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_session_pkey" PRIMARY KEY ("auth_session_id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "refresh_token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "auth_session_id" UUID NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("refresh_token_id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "verification_token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_account_id" UUID NOT NULL,
    "type" "verification_token_type" NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("verification_token_id")
);

-- CreateTable
CREATE TABLE "user_interaction" (
    "user_interaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "hotel_id" UUID,
    "interaction_type" "interaction_type" NOT NULL,
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interaction_pkey" PRIMARY KEY ("user_interaction_id")
);

-- CreateTable
CREATE TABLE "user_item_rating" (
    "user_item_rating_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "rating_criterion_id" UUID NOT NULL,
    "review_id" UUID,
    "score" DECIMAL(3,1) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_item_rating_pkey" PRIMARY KEY ("user_item_rating_id")
);

-- CreateTable
CREATE TABLE "voucher" (
    "voucher_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "promotion_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" DECIMAL(14,2) NOT NULL,
    "max_discount" DECIMAL(14,2),
    "used_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("voucher_id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "wallet_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID,
    "hotel_id" UUID,
    "balance_available" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_pending" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "balance_reserved" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "wallet_transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "booking_id" UUID,
    "platform_manager_id" UUID,
    "type" "wallet_txn_type" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "balance_after" DECIMAL(14,2) NOT NULL,
    "description" VARCHAR(500),
    "idempotency_key" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("wallet_transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "booking_voucher_id_key" ON "booking"("voucher_id");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_amenity_hotel_id_amenity_id_key" ON "hotel_amenity"("hotel_id", "amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_booking_id_key" ON "invoice"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_invoice_number_key" ON "invoice"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_account_customer_id_loyalty_program_id_key" ON "loyalty_account"("customer_id", "loyalty_program_id");

-- CreateIndex
CREATE UNIQUE INDEX "rating_prediction_model_run_id_customer_id_hotel_id_rating__key" ON "rating_prediction"("model_run_id", "customer_id", "hotel_id", "rating_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_booking_id_key" ON "review"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_calendars_room_id_date_key" ON "room_calendars"("room_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "room_type_amenity_room_type_id_amenity_id_key" ON "room_type_amenity"("room_type_id", "amenity_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_type_bed_room_type_id_bed_type_id_key" ON "room_type_bed"("room_type_id", "bed_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_account_email_key" ON "user_account"("email");

-- CreateIndex
CREATE INDEX "auth_session_user_account_id_idx" ON "auth_session"("user_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_token_auth_session_id_idx" ON "refresh_token"("auth_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_hash_key" ON "verification_token"("token_hash");

-- CreateIndex
CREATE INDEX "verification_token_user_account_id_type_idx" ON "verification_token"("user_account_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_item_rating_customer_id_hotel_id_rating_criterion_id_key" ON "user_item_rating"("customer_id", "hotel_id", "rating_criterion_id");

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_customer_id_key" ON "wallet"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_hotel_id_key" ON "wallet"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transaction_idempotency_key_key" ON "wallet_transaction"("idempotency_key");

-- AddForeignKey
ALTER TABLE "admin" ADD CONSTRAINT "admin_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_function_call" ADD CONSTRAINT "ai_function_call_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_function_call" ADD CONSTRAINT "ai_function_call_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "hotel_staff"("hotel_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "hotel_staff"("hotel_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("voucher_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("promotion_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_loyalty_program_id_fkey" FOREIGN KEY ("loyalty_program_id") REFERENCES "loyalty_program"("loyalty_program_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_recommendation_id_fkey" FOREIGN KEY ("recommendation_id") REFERENCES "recommendation"("recommendation_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_embedding" ADD CONSTRAINT "content_embedding_knowledge_article_id_fkey" FOREIGN KEY ("knowledge_article_id") REFERENCES "knowledge_article"("knowledge_article_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_metric" ADD CONSTRAINT "content_metric_content_schedule_id_fkey" FOREIGN KEY ("content_schedule_id") REFERENCES "content_schedule"("content_schedule_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_schedule" ADD CONSTRAINT "content_schedule_marketing_content_id_fkey" FOREIGN KEY ("marketing_content_id") REFERENCES "marketing_content"("marketing_content_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_schedule" ADD CONSTRAINT "content_schedule_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_account"("social_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "hotel_staff"("hotel_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_preference" ADD CONSTRAINT "customer_preference_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel" ADD CONSTRAINT "hotel_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_amenity" ADD CONSTRAINT "hotel_amenity_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_amenity" ADD CONSTRAINT "hotel_amenity_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenity"("amenity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_partner" ADD CONSTRAINT "hotel_partner_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_properties" ADD CONSTRAINT "hotel_properties_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_properties" ADD CONSTRAINT "hotel_properties_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "hotel_verification_request"("verification_request_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_properties" ADD CONSTRAINT "hotel_properties_verification_document_id_fkey" FOREIGN KEY ("verification_document_id") REFERENCES "hotel_verification_document"("verification_document_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_room_config" ADD CONSTRAINT "hotel_room_config_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_staff" ADD CONSTRAINT "hotel_staff_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_staff" ADD CONSTRAINT "hotel_staff_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_document" ADD CONSTRAINT "hotel_verification_document_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "hotel_verification_request"("verification_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_document" ADD CONSTRAINT "hotel_verification_document_parent_document_id_fkey" FOREIGN KEY ("parent_document_id") REFERENCES "hotel_verification_document"("verification_document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_request" ADD CONSTRAINT "hotel_verification_request_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article" ADD CONSTRAINT "knowledge_article_knowledge_category_id_fkey" FOREIGN KEY ("knowledge_category_id") REFERENCES "knowledge_category"("knowledge_category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_article" ADD CONSTRAINT "knowledge_article_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_account" ADD CONSTRAINT "loyalty_account_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_account" ADD CONSTRAINT "loyalty_account_loyalty_program_id_fkey" FOREIGN KEY ("loyalty_program_id") REFERENCES "loyalty_program"("loyalty_program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_program" ADD CONSTRAINT "loyalty_program_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_content" ADD CONSTRAINT "marketing_content_hotel_staff_id_fkey" FOREIGN KEY ("hotel_staff_id") REFERENCES "hotel_staff"("hotel_staff_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("conversation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("user_account_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_manager" ADD CONSTRAINT "platform_manager_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violation" ADD CONSTRAINT "policy_violation_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violation" ADD CONSTRAINT "policy_violation_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price" ADD CONSTRAINT "price_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price" ADD CONSTRAINT "price_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion" ADD CONSTRAINT "promotion_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_prediction" ADD CONSTRAINT "rating_prediction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_prediction" ADD CONSTRAINT "rating_prediction_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_prediction" ADD CONSTRAINT "rating_prediction_model_run_id_fkey" FOREIGN KEY ("model_run_id") REFERENCES "model_run"("model_run_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rating_prediction" ADD CONSTRAINT "rating_prediction_rating_criterion_id_fkey" FOREIGN KEY ("rating_criterion_id") REFERENCES "rating_criterion"("rating_criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_model_run_id_fkey" FOREIGN KEY ("model_run_id") REFERENCES "model_run"("model_run_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation" ADD CONSTRAINT "recommendation_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room" ADD CONSTRAINT "room_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_calendars" ADD CONSTRAINT "room_calendars_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_calendars" ADD CONSTRAINT "room_calendars_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_image" ADD CONSTRAINT "room_image_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "room"("room_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type" ADD CONSTRAINT "room_type_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenity" ADD CONSTRAINT "room_type_amenity_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_amenity" ADD CONSTRAINT "room_type_amenity_amenity_id_fkey" FOREIGN KEY ("amenity_id") REFERENCES "amenity"("amenity_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_bed" ADD CONSTRAINT "room_type_bed_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_bed" ADD CONSTRAINT "room_type_bed_bed_type_id_fkey" FOREIGN KEY ("bed_type_id") REFERENCES "bed_type"("bed_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_account" ADD CONSTRAINT "social_account_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_session" ADD CONSTRAINT "auth_session_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_auth_session_id_fkey" FOREIGN KEY ("auth_session_id") REFERENCES "auth_session"("auth_session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_token" ADD CONSTRAINT "verification_token_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "user_account"("user_account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_interaction" ADD CONSTRAINT "user_interaction_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_rating" ADD CONSTRAINT "user_item_rating_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_rating" ADD CONSTRAINT "user_item_rating_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_rating" ADD CONSTRAINT "user_item_rating_rating_criterion_id_fkey" FOREIGN KEY ("rating_criterion_id") REFERENCES "rating_criterion"("rating_criterion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_item_rating" ADD CONSTRAINT "user_item_rating_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "review"("review_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotion"("promotion_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher" ADD CONSTRAINT "voucher_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer"("customer_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("wallet_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "wallet_transaction_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;
