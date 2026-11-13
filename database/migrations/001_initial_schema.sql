-- ReceiptIQ Schema Migration 001: Initial Schema
-- PostgreSQL 15+ compatible with Supabase Auth integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    preferred_currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT unique_user_category UNIQUE (user_id, category_name)
);

-- 3. Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    merchant_name TEXT NOT NULL,
    merchant_address TEXT,
    merchant_phone VARCHAR(50),
    invoice_number VARCHAR(100),
    receipt_number VARCHAR(100),
    purchase_date DATE NOT NULL,
    purchase_time TIME,
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    subtotal NUMERIC(12, 2) DEFAULT 0.00,
    discount NUMERIC(12, 2) DEFAULT 0.00,
    tax NUMERIC(12, 2) DEFAULT 0.00,
    cgst NUMERIC(12, 2) DEFAULT 0.00,
    sgst NUMERIC(12, 2) DEFAULT 0.00,
    igst NUMERIC(12, 2) DEFAULT 0.00,
    additional_charges NUMERIC(12, 2) DEFAULT 0.00,
    delivery_fees NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    document_type VARCHAR(50) DEFAULT 'receipt',
    original_file_path TEXT,
    extraction_confidence NUMERIC(4, 2) DEFAULT 1.00,
    document_status VARCHAR(20) DEFAULT 'GREEN' CHECK (document_status IN ('GREEN', 'YELLOW', 'RED')),
    document_status_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    CONSTRAINT check_positive_grand_total CHECK (grand_total >= 0)
);

-- 4. Receipt Items Table
CREATE TABLE IF NOT EXISTS public.receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00 NOT NULL,
    unit_price NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Other',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 5. Warranties Table
CREATE TABLE IF NOT EXISTS public.warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    brand VARCHAR(100),
    purchase_date DATE NOT NULL,
    warranty_duration VARCHAR(100),
    expiry_date DATE NOT NULL,
    serial_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 6. AI Conversations Table
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 7. AI Messages Table
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_receipts_user_date ON public.receipts (user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_merchant ON public.receipts (user_id, merchant_name);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON public.receipt_items (receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON public.receipt_items (category);
CREATE INDEX IF NOT EXISTS idx_warranties_user_expiry ON public.warranties (user_id, expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages (conversation_id, created_at ASC);
