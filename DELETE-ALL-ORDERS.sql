-- =====================================================
-- DELETE ALL ORDERS
-- =====================================================
-- WARNING: This will delete ALL orders from the database!

-- Step 1: Show current orders before deletion
SELECT 'ORDERS BEFORE DELETION' as status;
SELECT 
    id::text as order_id,
    buyerid::text as buyer_id,
    status,
    totalamount,
    createdat
FROM orders
ORDER BY createdat DESC;

-- Step 2: Count orders
SELECT 
    'TOTAL ORDERS' as info,
    COUNT(*) as count
FROM orders;

-- Step 3: Delete all orders
DELETE FROM orders;

-- Step 4: Verify deletion
SELECT 'AFTER DELETION' as status;
SELECT 
    COUNT(*) as remaining_orders
FROM orders;

-- Step 5: Also delete related feedback (optional)
-- Uncomment if you want to delete feedback too
-- DELETE FROM feedback WHERE orderid IS NOT NULL;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL ORDERS DELETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Orders table is now empty';
    RAISE NOTICE 'Refresh your browser to see changes';
    RAISE NOTICE '========================================';
END $$;
