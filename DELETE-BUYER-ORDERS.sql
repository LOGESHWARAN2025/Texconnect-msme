-- =====================================================
-- DELETE SPECIFIC BUYER'S ORDERS
-- =====================================================

-- Step 1: Show all buyers and their orders
SELECT 'ALL BUYERS AND ORDERS' as info;
SELECT 
    u.id::text as buyer_id,
    u.username as buyer_name,
    u.email,
    COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o."buyerId" = u.id
WHERE u.role = 'buyer'
GROUP BY u.id, u.username, u.email
ORDER BY order_count DESC;

-- Step 2: Show all orders with buyer details
SELECT 'ALL ORDERS' as info;
SELECT 
    o.id::text as order_id,
    u.username as buyer_name,
    o.status,
    o.totalamount,
    o.createdat
FROM orders o
LEFT JOIN users u ON u.id = o."buyerId"
ORDER BY o.createdat DESC;

-- Step 3: DELETE ALL ORDERS (for all buyers)
-- Uncomment the line below to delete all orders
-- DELETE FROM orders;

-- OR delete orders for a specific buyer
-- Replace 'BUYER_ID_HERE' with actual buyer ID
-- DELETE FROM orders WHERE "buyerId" = 'BUYER_ID_HERE';

-- Step 4: Verify
SELECT 
    'REMAINING ORDERS' as info,
    COUNT(*) as count
FROM orders;

-- Instructions
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TO DELETE ORDERS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. To delete ALL orders:';
    RAISE NOTICE '   Uncomment: DELETE FROM orders;';
    RAISE NOTICE '';
    RAISE NOTICE '2. To delete specific buyer orders:';
    RAISE NOTICE '   Copy buyer_id from results above';
    RAISE NOTICE '   Uncomment and replace BUYER_ID_HERE';
    RAISE NOTICE '========================================';
END $$;
