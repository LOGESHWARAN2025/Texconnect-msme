-- =====================================================
-- DEBUG MSME ORDERS - Why aren't they showing?
-- =====================================================

-- Step 1: Check if orders exist
SELECT '========================================' as step;
SELECT '1. DO ORDERS EXIST?' as step;
SELECT '========================================' as step;

SELECT COUNT(*) as total_orders FROM orders;

SELECT 
    id,
    "buyerName",
    "itemName",
    status,
    "totalAmount",
    "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 5;

-- Step 2: Check order items structure
SELECT '========================================' as step;
SELECT '2. ORDER ITEMS STRUCTURE' as step;
SELECT '========================================' as step;

SELECT 
    id,
    "buyerName",
    items,
    jsonb_typeof(items) as items_type,
    jsonb_array_length(items) as items_count
FROM orders
LIMIT 3;

-- Step 3: Extract productId from each order
SELECT '========================================' as step;
SELECT '3. PRODUCT IDs IN ORDERS' as step;
SELECT '========================================' as step;

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item.value->>'productId' as product_id,
    item.value->>'productName' as product_name,
    item.value->>'quantity' as quantity,
    item.value->>'price' as price
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
LIMIT 10;

-- Step 4: Check products table
SELECT '========================================' as step;
SELECT '4. PRODUCTS IN DATABASE' as step;
SELECT '========================================' as step;

SELECT 
    id,
    name,
    stock,
    price,
    "msmeId"
FROM products
LIMIT 10;

-- Step 5: Match orders to MSME products
SELECT '========================================' as step;
SELECT '5. ORDERS MATCHED TO MSME PRODUCTS' as step;
SELECT '========================================' as step;

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item.value->>'productId' as product_id_in_order,
    p.id as product_id_in_db,
    p.name as product_name,
    p."msmeId" as msme_owner_id,
    u.username as msme_owner_name
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
LEFT JOIN products p ON p.id = (item.value->>'productId')::UUID
LEFT JOIN users u ON u.id = p."msmeId"
ORDER BY o."createdAt" DESC
LIMIT 10;

-- Step 6: Check for orphaned orders (orders with products that don't exist)
SELECT '========================================' as step;
SELECT '6. ORPHANED ORDERS (products not found)' as step;
SELECT '========================================' as step;

SELECT 
    o.id as order_id,
    o."buyerName",
    item.value->>'productId' as missing_product_id,
    item.value->>'productName' as product_name_in_order
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
WHERE NOT EXISTS (
    SELECT 1 FROM products p 
    WHERE p.id = (item.value->>'productId')::UUID
);

-- Step 7: Get orders for a specific MSME (replace with actual MSME user ID)
SELECT '========================================' as step;
SELECT '7. ORDERS FOR SPECIFIC MSME' as step;
SELECT '========================================' as step;

-- First, show all MSMEs
SELECT 'Available MSMEs:' as info;
SELECT id, username, email FROM users WHERE role = 'msme';

-- Then show orders for each MSME
DO $$
DECLARE
    msme_record RECORD;
    order_count INTEGER;
BEGIN
    FOR msme_record IN 
        SELECT id, username FROM users WHERE role = 'msme'
    LOOP
        SELECT COUNT(*) INTO order_count
        FROM orders o
        WHERE EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(o.items) as item
            JOIN products p ON p.id = (item.value->>'productId')::UUID
            WHERE p."msmeId" = msme_record.id
        );
        
        RAISE NOTICE 'MSME: % (%) has % orders', 
            msme_record.username, 
            msme_record.id, 
            order_count;
    END LOOP;
END $$;

-- Step 8: Summary
DO $$ 
DECLARE
    total_orders INTEGER;
    total_products INTEGER;
    total_msmes INTEGER;
    orders_with_valid_products INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO total_products FROM products;
    SELECT COUNT(*) INTO total_msmes FROM users WHERE role = 'msme';
    
    SELECT COUNT(DISTINCT o.id) INTO orders_with_valid_products
    FROM orders o
    CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
    WHERE EXISTS (
        SELECT 1 FROM products p 
        WHERE p.id = (item.value->>'productId')::UUID
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Orders: %', total_orders;
    RAISE NOTICE 'Total Products: %', total_products;
    RAISE NOTICE 'Total MSMEs: %', total_msmes;
    RAISE NOTICE 'Orders with valid products: %', orders_with_valid_products;
    RAISE NOTICE '========================================';
    
    IF total_orders = 0 THEN
        RAISE NOTICE '❌ NO ORDERS IN DATABASE!';
        RAISE NOTICE 'Action: Place a test order as buyer';
    ELSIF orders_with_valid_products = 0 THEN
        RAISE NOTICE '❌ NO ORDERS HAVE VALID PRODUCTS!';
        RAISE NOTICE 'Action: Check if products were deleted';
    ELSIF total_msmes = 0 THEN
        RAISE NOTICE '❌ NO MSME USERS!';
        RAISE NOTICE 'Action: Create MSME user';
    ELSE
        RAISE NOTICE '✅ Data looks good!';
        RAISE NOTICE 'Check frontend console logs for filtering issues';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
