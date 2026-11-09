-- StayReco database script (PostgreSQL 16 with pgvector and pgcrypto)
-- Generated on 2026-11-03 by concatenating the Prisma migrations in backend/prisma/migrations in order.
-- The migrations stay the source of truth: to rebuild, run 'npx prisma migrate deploy' or run this file on an empty database.
-- Seed data: 'npm run db:seed' (backend/prisma/seed.ts and seed-demo.ts).

-- ============================================================
-- Migration: 20261016102804_init
-- ============================================================
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

-- ============================================================
-- Migration: 20261016102829_constraints
-- ============================================================
-- audit_log: at most one actor. Events without an actor (e.g. a failed login with an unknown email) are allowed.
ALTER TABLE audit_log ADD CONSTRAINT audit_log_one_actor CHECK (
  num_nonnulls(customer_id, hotel_staff_id, hotel_partner_id, admin_id, platform_manager_id) <= 1);

-- wallet: never owned by a customer and a hotel at the same time
ALTER TABLE wallet ADD CONSTRAINT wallet_single_owner CHECK (
  NOT (customer_id IS NOT NULL AND hotel_id IS NOT NULL));

-- The HNSW index on content_embedding.embedding is added later with the RAG module.
-- Prisma cannot declare it in schema.prisma, so every new migration would try to drop it.

-- ============================================================
-- Migration: 20261016111028_schema_fixes
-- ============================================================
/*
  Warnings:

  - Added the required column `hotel_id` to the `hotel_verification_request` table without a default value. This is not possible if the table is not empty.
  - Made the column `hotel_partner_id` on table `policy_violation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ai_config" DROP CONSTRAINT "ai_config_admin_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_config" DROP CONSTRAINT "ai_config_hotel_partner_id_fkey";

-- DropForeignKey
ALTER TABLE "ai_function_call" DROP CONSTRAINT "ai_function_call_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "hotel_properties" DROP CONSTRAINT "hotel_properties_verification_document_id_fkey";

-- DropForeignKey
ALTER TABLE "hotel_verification_request" DROP CONSTRAINT "hotel_verification_request_platform_manager_id_fkey";

-- DropForeignKey
ALTER TABLE "policy_violation" DROP CONSTRAINT "policy_violation_hotel_partner_id_fkey";

-- AlterTable
ALTER TABLE "ai_config" ALTER COLUMN "admin_id" DROP NOT NULL,
ALTER COLUMN "hotel_partner_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ai_function_call" ALTER COLUMN "booking_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hotel_properties" ALTER COLUMN "verification_document_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "hotel_verification_request" ADD COLUMN     "hotel_id" UUID NOT NULL,
ALTER COLUMN "platform_manager_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "policy_violation" ALTER COLUMN "hotel_partner_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "review" ALTER COLUMN "title" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_config" ADD CONSTRAINT "ai_config_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_function_call" ADD CONSTRAINT "ai_function_call_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_properties" ADD CONSTRAINT "hotel_properties_verification_document_id_fkey" FOREIGN KEY ("verification_document_id") REFERENCES "hotel_verification_document"("verification_document_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_request" ADD CONSTRAINT "hotel_verification_request_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_verification_request" ADD CONSTRAINT "hotel_verification_request_platform_manager_id_fkey" FOREIGN KEY ("platform_manager_id") REFERENCES "platform_manager"("platform_manager_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_violation" ADD CONSTRAINT "policy_violation_hotel_partner_id_fkey" FOREIGN KEY ("hotel_partner_id") REFERENCES "hotel_partner"("hotel_partner_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ai_config: owned by exactly one of admin (platform-wide config) or hotel partner (brand voice config)
ALTER TABLE ai_config ADD CONSTRAINT ai_config_single_owner CHECK (
  num_nonnulls(admin_id, hotel_partner_id) = 1);

-- ============================================================
-- Migration: 20261016111916_booking_room_type
-- ============================================================
/*
  Warnings:

  - Added the required column `room_type_id` to the `booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking" ADD COLUMN     "room_type_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- Migration: 20261017093839_email_otp_verification
-- ============================================================
-- AlterEnum
ALTER TYPE "account_status" ADD VALUE 'PENDING_VERIFICATION';

-- AlterTable
ALTER TABLE "verification_token" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 0;

-- ============================================================
-- Migration: 20261017222857_hotel_images_staff_permissions
-- ============================================================
-- CreateEnum
CREATE TYPE "staff_permission" AS ENUM ('BOOKING', 'FRONT_DESK', 'CUSTOMER_CARE', 'REFUND', 'MARKETING');

-- AlterTable
ALTER TABLE "hotel_staff" ADD COLUMN     "permissions" "staff_permission"[] DEFAULT ARRAY[]::"staff_permission"[];

-- CreateTable
CREATE TABLE "hotel_image" (
    "hotel_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hotel_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(255),
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_image_pkey" PRIMARY KEY ("hotel_image_id")
);

-- CreateTable
CREATE TABLE "room_type_image" (
    "room_type_image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "room_type_id" UUID NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "storage_key" VARCHAR(255) NOT NULL,
    "caption" VARCHAR(255),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_type_image_pkey" PRIMARY KEY ("room_type_image_id")
);

-- CreateIndex
CREATE INDEX "hotel_image_hotel_id_idx" ON "hotel_image"("hotel_id");

-- CreateIndex
CREATE INDEX "room_type_image_room_type_id_idx" ON "room_type_image"("room_type_id");

-- AddForeignKey
ALTER TABLE "hotel_image" ADD CONSTRAINT "hotel_image_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_image" ADD CONSTRAINT "room_type_image_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- Migration: 20261019120000_hotel_room_config_unique
-- ============================================================
-- One room configuration per hotel (contract D4).
-- CreateIndex
CREATE UNIQUE INDEX "hotel_room_config_hotel_id_key" ON "hotel_room_config"("hotel_id");

-- ============================================================
-- Migration: 20261020120000_account_status_deactivated
-- ============================================================
-- Staff turned off by their hotel partner (separate from an admin SUSPENDED).
-- AlterEnum
ALTER TYPE "account_status" ADD VALUE 'DEACTIVATED';

-- ============================================================
-- Migration: 20261023085907_booking_pricing_rules
-- ============================================================
-- Search, booking and pricing rules (docs/phases/phase-2-search-booking.md, "Schema changes").
-- Columns that become NOT NULL are added nullable first and filled from existing rows, so the migration also runs on
-- databases that already hold prices or bookings.

-- CreateExtension (accent-insensitive hotel search)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "price_rule_type" AS ENUM ('BASE', 'SEASON', 'EARLY_BIRD', 'LAST_MINUTE');

-- CreateEnum
CREATE TYPE "price_adjustment_type" AS ENUM ('SET_PRICE', 'AMOUNT', 'PERCENT');

-- AlterEnum: unpaid hold that ran out
ALTER TYPE "booking_status" ADD VALUE 'EXPIRED';

-- AlterEnum: cancelled with money to refund, waiting for the partner
ALTER TYPE "payment_status" ADD VALUE 'REFUND_PENDING';

-- ── price: pricing rules ───────────────────────────────────

ALTER TABLE "price" ADD COLUMN     "adjustment_type" "price_adjustment_type",
ADD COLUMN     "adjustment_value" DECIMAL(14,2),
ADD COLUMN     "max_days_before" INTEGER,
ADD COLUMN     "min_days_before" INTEGER,
ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rule_type" "price_rule_type",
ALTER COLUMN "price_per_night" DROP NOT NULL;

-- Existing rows without room, dates or weekday are the base prices (decision D3).
UPDATE "price" SET "rule_type" = 'BASE'
WHERE "room_id" IS NULL AND "valid_from" IS NULL AND "valid_to" IS NULL AND "day_of_week" IS NULL;

-- Any other row was a dated or weekday price: keep it as a seasonal rule that sets the nightly price.
UPDATE "price" SET "rule_type" = 'SEASON', "adjustment_type" = 'SET_PRICE',
  "adjustment_value" = "price_per_night", "price_per_night" = NULL
WHERE "rule_type" IS NULL;

ALTER TABLE "price" ALTER COLUMN "rule_type" SET NOT NULL;

-- A base price has a nightly price and no adjustment; every other rule has an adjustment.
ALTER TABLE "price" ADD CONSTRAINT "price_rule_shape" CHECK (
  ("rule_type" = 'BASE' AND "price_per_night" IS NOT NULL AND "adjustment_type" IS NULL AND "adjustment_value" IS NULL)
  OR ("rule_type" <> 'BASE' AND "adjustment_type" IS NOT NULL AND "adjustment_value" IS NOT NULL)
);

-- ── booking: guest details and terms fixed at booking time ─

ALTER TABLE "booking" ADD COLUMN     "arrival_time" TIME(0),
ADD COLUMN     "cancel_fee_percent" DECIMAL(5,2),
ADD COLUMN     "commission_rate" DECIMAL(5,2),
ADD COLUMN     "contact_phone" VARCHAR(20),
ADD COLUMN     "free_cancel_until" TIMESTAMPTZ(6),
ADD COLUMN     "guest_name" VARCHAR(100);

-- Bookings made before these columns: the booker is the guest, no free cancellation, the partner's current rate.
UPDATE "booking" AS b SET
  "guest_name" = LEFT(ua."full_name", 100),
  "contact_phone" = COALESCE(ua."phone", ''),
  "cancel_fee_percent" = 100,
  "commission_rate" = hp."commission_rate"
FROM "user_account" AS ua, "room_type" AS rt, "hotel" AS h, "hotel_partner" AS hp
WHERE ua."user_account_id" = b."customer_id"
  AND rt."room_type_id" = b."room_type_id"
  AND h."hotel_id" = rt."hotel_id"
  AND hp."hotel_partner_id" = h."hotel_partner_id";

ALTER TABLE "booking" ALTER COLUMN "cancel_fee_percent" SET NOT NULL,
ALTER COLUMN "commission_rate" SET NOT NULL,
ALTER COLUMN "contact_phone" SET NOT NULL,
ALTER COLUMN "guest_name" SET NOT NULL;

ALTER TABLE "booking" ADD CONSTRAINT "booking_terms_range" CHECK (
  "cancel_fee_percent" BETWEEN 0 AND 100 AND "commission_rate" BETWEEN 0 AND 100
);

-- ============================================================
-- Migration: 20261023105156_booking_rooms_and_nightly_prices
-- ============================================================
-- Rooms and nightly prices of a booking, kept after its room_calendars rows are released (expiry, cancellation).
-- Bookings made before these columns get 1 room and no nightly breakdown; the defaults are dropped afterwards so new
-- bookings must always set both.

ALTER TABLE "booking" ADD COLUMN     "nightly_prices" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "num_rooms" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "booking" ALTER COLUMN "nightly_prices" DROP DEFAULT,
ALTER COLUMN "num_rooms" DROP DEFAULT;

ALTER TABLE "booking" ADD CONSTRAINT "booking_num_rooms_range" CHECK ("num_rooms" BETWEEN 1 AND 8);

-- ============================================================
-- Migration: 20261023123347_platform_wallet
-- ============================================================
-- Platform wallet (money-rules §5): StayReco's own share (commission, platform-side adjustments) gets a wallet like
-- hotels and customers, so revenue has a running balance and the sum of all wallets reconciles with the bank account.

-- CreateEnum
CREATE TYPE "wallet_owner_type" AS ENUM ('CUSTOMER', 'HOTEL', 'PLATFORM');

-- Existing wallets get their type from the owner column that is set.
ALTER TABLE "wallet" ADD COLUMN "owner_type" "wallet_owner_type";
UPDATE "wallet"
SET "owner_type" = (CASE WHEN "customer_id" IS NOT NULL THEN 'CUSTOMER' ELSE 'HOTEL' END)::"wallet_owner_type";
ALTER TABLE "wallet" ALTER COLUMN "owner_type" SET NOT NULL;

-- Exactly one owner, matching the type; the platform wallet has neither owner column.
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_owner_shape" CHECK (
  ("owner_type" = 'CUSTOMER' AND "customer_id" IS NOT NULL AND "hotel_id" IS NULL)
  OR ("owner_type" = 'HOTEL' AND "hotel_id" IS NOT NULL AND "customer_id" IS NULL)
  OR ("owner_type" = 'PLATFORM' AND "customer_id" IS NULL AND "hotel_id" IS NULL)
);

-- A single platform wallet: it has a fixed id, and no other row may be PLATFORM.
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_single_platform" CHECK (
  "owner_type" <> 'PLATFORM' OR "wallet_id" = '00000000-0000-0000-0000-000000000001'
);

INSERT INTO "wallet" ("wallet_id", "owner_type", "updated_at")
VALUES ('00000000-0000-0000-0000-000000000001', 'PLATFORM', now())
ON CONFLICT ("wallet_id") DO NOTHING;

-- ============================================================
-- Migration: 20261028141942_dashboard_indexes
-- ============================================================
-- CreateIndex
CREATE INDEX "booking_room_type_id_check_in_date_idx" ON "booking"("room_type_id", "check_in_date");

-- CreateIndex
CREATE INDEX "booking_room_type_id_created_at_idx" ON "booking"("room_type_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transaction_wallet_id_created_at_idx" ON "wallet_transaction"("wallet_id", "created_at");

-- ============================================================
-- Migration: 20261029090134_hotel_operations
-- ============================================================
-- AlterEnum
ALTER TYPE "wallet_txn_type" ADD VALUE 'SETTLEMENT';

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "link" VARCHAR(500);

-- CreateIndex
CREATE INDEX "notification_user_account_id_created_at_idx" ON "notification"("user_account_id", "created_at" DESC);

-- ============================================================
-- Migration: 20261030065404_audit_log_entity_index
-- ============================================================
-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_created_at_idx" ON "audit_log"("entity_type", "entity_id", "created_at");

-- ============================================================
-- Migration: 20261109100000_booking_items
-- ============================================================
-- Bookings with several room types (docs/design/booking-items.md): the room lines move from booking to booking_item,
-- and the hotel is kept on the booking. Every existing booking becomes one item.

-- CreateTable
CREATE TABLE "booking_item" (
    "booking_item_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "booking_id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "num_rooms" INTEGER NOT NULL,
    "nightly_prices" JSONB NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "booking_item_pkey" PRIMARY KEY ("booking_item_id"),
    CONSTRAINT "booking_item_num_rooms_range" CHECK ("num_rooms" BETWEEN 1 AND 8)
);

-- Backfill: the hotel from the room type, one item per booking (no discounts yet, so subtotal = total).
ALTER TABLE "booking" ADD COLUMN "hotel_id" UUID;

UPDATE "booking" b SET "hotel_id" = rt."hotel_id"
FROM "room_type" rt WHERE rt."room_type_id" = b."room_type_id";

INSERT INTO "booking_item" ("booking_id", "room_type_id", "num_rooms", "nightly_prices", "subtotal")
SELECT "booking_id", "room_type_id", "num_rooms", "nightly_prices", "total_amount" FROM "booking";

ALTER TABLE "booking" ALTER COLUMN "hotel_id" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "booking" DROP CONSTRAINT "booking_room_type_id_fkey";

-- DropIndex
DROP INDEX "booking_room_type_id_check_in_date_idx";

-- DropIndex
DROP INDEX "booking_room_type_id_created_at_idx";

-- AlterTable (drops the CHECK booking_num_rooms_range with num_rooms)
ALTER TABLE "booking" DROP COLUMN "nightly_prices",
DROP COLUMN "num_rooms",
DROP COLUMN "room_type_id";

-- CreateIndex
CREATE INDEX "booking_item_room_type_id_idx" ON "booking_item"("room_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "booking_item_booking_id_room_type_id_key" ON "booking_item"("booking_id", "room_type_id");

-- CreateIndex
CREATE INDEX "booking_hotel_id_check_in_date_idx" ON "booking"("hotel_id", "check_in_date");

-- CreateIndex
CREATE INDEX "booking_hotel_id_created_at_idx" ON "booking"("hotel_id", "created_at");

-- AddForeignKey
ALTER TABLE "booking" ADD CONSTRAINT "booking_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotel"("hotel_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"("booking_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_item" ADD CONSTRAINT "booking_item_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_type"("room_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;
