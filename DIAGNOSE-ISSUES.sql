-- =====================================================
-- DIAGNOSTIC SCRIPT - CHECK ALL ISSUES
-- =====================================================
-- Run this to diagnose why orders/stock aren't working
-- =====================================================

-- Check 1: Do orders exist?
SELECT '========================================' as info;
SELECT '1. ORDERS IN DATABASE' as info;
SELECT '========================================' as info;

SELECT 
    id,
    "buyerName",
    "itemName",
    status,
    items,
    "totalAmount",
    "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 5;

SELECT 'Total orders:', COUNT(*) FROM orders;

-- Check 2: What's in the items JSONB?
SELECT '========================================' as info;
SELECT '2. ORDER ITEMS STRUCTURE' as info;
SELECT '========================================' as info;

SELECT 
    id,
    "buyerName",
    items,
    jsonb_array_length(items) as item_count
FROM orders
LIMIT 3;

-- Check 3: Extract productId from items
SELECT '========================================' as info;
SELECT '3. PRODUCT IDs IN ORDERS' as info;
SELECT '========================================' as info;

SELECT 
    o.id as order_id,
    o."buyerName",
    item.value->>'productId' as product_id,
    item.value->>'productName' as product_name,
    item.value->>'quantity' as quantity
FROM orders o,
jsonb_array_elements(o.items) as item
LIMIT 10;

-- Check 4: Do these products exist?
SELECT '========================================' as info;
SELECT '4. PRODUCTS TABLE' as info;
SELECT '========================================' as info;

SELECT 
    id,
    name,
    stock,
    "msmeId",
    "updatedAt"
FROM products
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Check 5: Match orders to products
SELECT '========================================' as info;
SELECT '5. ORDERS MATCHED TO PRODUCTS' as info;
SELECT '========================================' as info;

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item.value->>'productId' as product_id,
    p.name as product_name,
    p."msmeId" as msme_owner,
    p.stock as current_stock
FROM orders o,
jsonb_array_elements(o.items) as item
LEFT JOIN products p ON p.id = (item.value->>'productId')::UUID
LIMIT 10;

-- Check 6: Triggers installed?
SELECT '========================================' as info;
SELECT '6. TRIGGERS ON ORDERS TABLE' as info;
SELECT '========================================' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- Check 7: RLS Policies
SELECT '========================================' as info;
SELECT '7. RLS POLICIES ON ORDERS' as info;
SELECT '========================================' as info;

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE tablename = 'orders';

-- Check 8: Recent stock changes
SELECT '========================================' as info;
SELECT '8. RECENT PRODUCT STOCK CHANGES' as info;
SELECT '========================================' as info;

SELECT 
    name,
    stock,
    "msmeId",
    "updatedAt"
FROM products
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Summary
DO $$ 
DECLARE
    order_count INTEGER;
    product_count INTEGER;
    trigger_count INTEGER;
    policy_count INTEGER;
    pending_count INTEGER;
    accepted_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE event_object_table = 'orders';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'orders';
    SELECT COUNT(*) INTO pending_count FROM orders WHERE status = 'Pending';
    SELECT COUNT(*) INTO accepted_count FROM orders WHERE status = 'Accepted';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Status:';
    RAISE NOTICE '  Orders: %', order_count;
    RAISE NOTICE '  Products: %', product_count;
    RAISE NOTICE '  Triggers: %', trigger_count;
    RAISE NOTICE '  RLS Policies: %', policy_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Order Status:';
    RAISE NOTICE '  Pending: %', pending_count;
    RAISE NOTICE '  Accepted: %', accepted_count;
    RAISE NOTICE '========================================';
    
    IF order_count = 0 THEN
        RAISE NOTICE '⚠️  NO ORDERS FOUND!';
        RAISE NOTICE 'Action: Place a test order as buyer';
    END IF;
    
    IF trigger_count < 2 THEN
        RAISE NOTICE '❌ MISSING TRIGGERS!';
        RAISE NOTICE 'Action: Run COMPLETE-FIX-ALL.sql';
    ELSE
        RAISE NOTICE '✅ Triggers installed';
    END IF;
    
    IF policy_count < 7 THEN
        RAISE NOTICE '⚠️  INCOMPLETE RLS POLICIES!';
        RAISE NOTICE 'Action: Run COMPLETE-FIX-ALL.sql';
    ELSE
        RAISE NOTICE '✅ RLS policies configured';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
