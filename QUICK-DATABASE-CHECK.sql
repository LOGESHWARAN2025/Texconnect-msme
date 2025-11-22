-- =====================================================
-- QUICK DATABASE CHECK
-- =====================================================
-- Run this to verify data exists and check structure
-- =====================================================

-- Step 1: Check if tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'products', 'inventory', 'orders')
ORDER BY table_name;

-- Step 2: Check users table
SELECT 
    id,
    email,
    username,
    role,
    companyname
FROM users
WHERE role = 'msme'
LIMIT 5;

-- Step 3: Check products table structure and data
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Check products data
SELECT 
    id,
    name,
    msmeid,
    stock,
    price
FROM products
LIMIT 5;

-- Step 4: Check inventory table structure and data
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Check inventory data
SELECT 
    id,
    name,
    msmeid,
    stock,
    price
FROM inventory
LIMIT 5;

-- Step 5: Check orders table
SELECT 
    id,
    "buyerId",
    "buyerName",
    status,
    "totalAmount",
    items
FROM orders
LIMIT 5;

-- Step 6: Count data by MSME
SELECT 
    u.id as msme_id,
    u.username as msme_name,
    u.email,
    (SELECT COUNT(*) FROM products WHERE msmeid = u.id) as products_count,
    (SELECT COUNT(*) FROM inventory WHERE msmeid = u.id) as inventory_count
FROM users u
WHERE u.role = 'msme'
ORDER BY u.username;

-- Step 7: Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('products', 'inventory', 'orders')
ORDER BY tablename, policyname;

-- Step 8: Check if realtime is enabled
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('products', 'inventory', 'orders');

-- =====================================================
-- RESULTS INTERPRETATION
-- =====================================================
-- If Step 2 shows MSME users: ✅ Users exist
-- If Step 4 shows products: ✅ Products exist
-- If Step 6 shows inventory: ✅ Inventory exists
-- If Step 8 shows 0 rows: ❌ Realtime not enabled
-- If Step 7 shows no policies: ❌ RLS blocking access
-- =====================================================
