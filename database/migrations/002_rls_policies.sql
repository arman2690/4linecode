-- ReceiptIQ Schema Migration 002: Row Level Security (RLS) Policies
-- Strict isolation ensuring users can only read/write their own records

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Categories Policies (User-created or system defaults where user_id IS NULL)
CREATE POLICY "Users can view system and their own categories"
    ON public.categories FOR SELECT
    USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Receipts Policies
CREATE POLICY "Users can view their own receipts"
    ON public.receipts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receipts"
    ON public.receipts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receipts"
    ON public.receipts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts"
    ON public.receipts FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Receipt Items Policies (Cascades through receipt ownership)
CREATE POLICY "Users can view their receipt items"
    ON public.receipt_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.receipts r
        WHERE r.id = receipt_items.receipt_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert receipt items"
    ON public.receipt_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.receipts r
        WHERE r.id = receipt_items.receipt_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can update receipt items"
    ON public.receipt_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.receipts r
        WHERE r.id = receipt_items.receipt_id AND r.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete receipt items"
    ON public.receipt_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.receipts r
        WHERE r.id = receipt_items.receipt_id AND r.user_id = auth.uid()
    ));

-- 5. Warranties Policies
CREATE POLICY "Users can view their warranties"
    ON public.warranties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their warranties"
    ON public.warranties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their warranties"
    ON public.warranties FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their warranties"
    ON public.warranties FOR DELETE
    USING (auth.uid() = user_id);

-- 6. AI Conversations Policies
CREATE POLICY "Users can view their AI conversations"
    ON public.ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert AI conversations"
    ON public.ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete AI conversations"
    ON public.ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- 7. AI Messages Policies
CREATE POLICY "Users can view messages in their conversations"
    ON public.ai_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages into their conversations"
    ON public.ai_messages FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ai_conversations c
        WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid()
    ));

-- Storage Bucket Policy for 'receipts'
-- In Supabase dashboard:
-- CREATE BUCKET receipts WITH (public = false);
