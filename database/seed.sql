-- ReceiptIQ Seed Data
-- Standard Default Categories for all users

INSERT INTO public.categories (id, user_id, category_name, is_default)
VALUES 
    (uuid_generate_v4(), NULL, 'Electronics', TRUE),
    (uuid_generate_v4(), NULL, 'Groceries', TRUE),
    (uuid_generate_v4(), NULL, 'Food and beverages', TRUE),
    (uuid_generate_v4(), NULL, 'Clothing', TRUE),
    (uuid_generate_v4(), NULL, 'Healthcare', TRUE),
    (uuid_generate_v4(), NULL, 'Transportation', TRUE),
    (uuid_generate_v4(), NULL, 'Education', TRUE),
    (uuid_generate_v4(), NULL, 'Entertainment', TRUE),
    (uuid_generate_v4(), NULL, 'Household', TRUE),
    (uuid_generate_v4(), NULL, 'Personal care', TRUE),
    (uuid_generate_v4(), NULL, 'Travel', TRUE),
    (uuid_generate_v4(), NULL, 'Other', TRUE)
ON CONFLICT DO NOTHING;
