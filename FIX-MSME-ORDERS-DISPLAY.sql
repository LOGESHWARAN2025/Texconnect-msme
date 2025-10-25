-- =====================================================
-- FIX MSME ORDERS NOT DISPLAYING
-- =====================================================
-- This script diagnoses why MSME orders aren't showing
-- =====================================================

-- Step 1: Check if orders exist
SELECT '========================================' as step;
SELECT '1. DO ORDERS EXIST IN DATABASE?' as step;
SELECT '========================================' as step;

SELECT COUNT(*) as total_orders FROM orders;

SELECT 
    id,
    "buyerName",
    status,
    "totalAmount",
    "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 5;

-- Step 2: Check if products exist
SELECT '========================================' as step;
SELECT '2. DO PRODUCTS EXIST?' as step;
SELECT '========================================' as step;

SELECT COUNT(*) as total_products FROM products;

SELECT 
    id,
    name,
    stock,
    price,
    msmeid
FROM products
LIMIT 5;

-- Step 3: Check MSMEs
SELECT '========================================' as step;
SELECT '3. LIST OF MSMEs' as step;
SELECT '========================================' as step;

SELECT 
    id,
    username,
    email,
    role
FROM users
WHERE role = 'msme';

-- Step 4: Match orders to products
SELECT '========================================' as step;
SELECT '4. ORDERS MATCHED TO PRODUCTS' as step;
SELECT '========================================' as step;

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item.value->>'productId' as product_id_in_order,
    item.value->>'productName' as product_name_in_order,
    p.id as product_id_in_db,
    p.name as product_name_in_db,
    p.msmeid as product_owner_id,
    u.username as product_owner_name
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
LEFT JOIN products p ON p.id = (item.value->>'productId')::UUID
LEFT JOIN users u ON u.id = p.msmeid
ORDER BY o."createdAt" DESC
LIMIT 10;

-- Step 5: Orders per MSME
SELECT '========================================' as step;
SELECT '5. ORDERS PER MSME' as step;
SELECT '========================================' as step;

SELECT 
    u.username as msme_name,
    u.id as msme_id,
    COUNT(DISTINCT o.id) as order_count
FROM users u
LEFT JOIN products p ON p.msmeid = u.id
LEFT JOIN orders o ON EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(o.items) as item
    WHERE (item.value->>'productId')::UUID = p.id
)
WHERE u.role = 'msme'
GROUP BY u.id, u.username
ORDER BY order_count DESC;

-- Step 6: Diagnostic Summary
DO $$
DECLARE
    total_orders INTEGER;
    total_products INTEGER;
    total_msmes INTEGER;
    msme_record RECORD;
    msme_product_count INTEGER;
    msme_order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO total_msmes FROM users WHERE role = 'msme';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Orders: %', total_orders;
    RAISE NOTICE 'Total Products: %', total_products;
    RAISE NOTICE 'Total MSMEs: %', total_msmes;
    RAISE NOTICE '========================================';
    
    IF total_orders = 0 THEN
        RAISE NOTICE '❌ NO ORDERS IN DATABASE!';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '  1. Login as Buyer';
        RAISE NOTICE '  2. Browse products';
        RAISE NOTICE '  3. Place an order';
        RAISE NOTICE '';
    ELSIF total_products = 0 THEN
        RAISE NOTICE '❌ NO PRODUCTS IN DATABASE!';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '  1. Login as MSME';
        RAISE NOTICE '  2. Go to Products section';
        RAISE NOTICE '  3. Add products';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '✅ Orders and Products exist';
        RAISE NOTICE '';
        RAISE NOTICE 'Checking each MSME:';
        RAISE NOTICE '----------------------------------------';
        
        FOR msme_record IN 
            SELECT id, username FROM users WHERE role = 'msme'
        LOOP
            -- Count products for this MSME
            SELECT COUNT(*) INTO msme_product_count
            FROM products
            WHERE msmeid = msme_record.id;
            
            -- Count orders for this MSME
            SELECT COUNT(DISTINCT o.id) INTO msme_order_count
            FROM orders o
            WHERE EXISTS (
                SELECT 1 
                FROM jsonb_array_elements(o.items) as item
                JOIN products p ON p.id = (item.value->>'productId')::UUID
                WHERE p.msmeid = msme_record.id
            );
            
            RAISE NOTICE 'MSME: %', msme_record.username;
            RAISE NOTICE '  Products: %', msme_product_count;
            RAISE NOTICE '  Orders: %', msme_order_count;
            
            IF msme_product_count = 0 THEN
                RAISE NOTICE '  ⚠️  This MSME has no products!';
            ELSIF msme_order_count = 0 THEN
                RAISE NOTICE '  ⚠️  No orders for this MSME''s products';
            ELSE
                RAISE NOTICE '  ✅ Should see % orders', msme_order_count;
            END IF;
            RAISE NOTICE '';
        END LOOP;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Check browser console (F12)';
    RAISE NOTICE '2. Look for these logs:';
    RAISE NOTICE '   🏭 MSME Products: { userProducts: ? }';
    RAISE NOTICE '   📋 OrdersView: { totalOrders: ? }';
    RAISE NOTICE '   ✅ Filtered MSME orders: ?';
    RAISE NOTICE '';
    RAISE NOTICE '3. If userProducts = 0:';
    RAISE NOTICE '   → MSME needs to create products';
    RAISE NOTICE '';
    RAISE NOTICE '4. If totalOrders = 0:';
    RAISE NOTICE '   → Place orders as Buyer';
    RAISE NOTICE '';
    RAISE NOTICE '5. If Filtered orders = 0:';
    RAISE NOTICE '   → Orders exist but not for this MSME';
    RAISE NOTICE '   → Place order for THIS MSME''s products';
    RAISE NOTICE '========================================';
END $$;
