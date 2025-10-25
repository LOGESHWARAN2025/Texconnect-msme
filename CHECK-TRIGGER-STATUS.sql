-- =====================================================
-- CHECK IF TRIGGER IS INSTALLED AND WORKING
-- =====================================================

-- Step 1: Check if trigger exists
SELECT '========================================' as info;
SELECT '1. TRIGGER STATUS' as info;
SELECT '========================================' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'orders'
AND trigger_name = 'order_acceptance_stock_trigger';

-- Step 2: Check if function exists
SELECT '========================================' as info;
SELECT '2. FUNCTION STATUS' as info;
SELECT '========================================' as info;

SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_name = 'handle_order_acceptance';

-- Step 3: Check inventory table structure
SELECT '========================================' as info;
SELECT '3. INVENTORY TABLE COLUMNS' as info;
SELECT '========================================' as info;

SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Step 4: Check current inventory stock
SELECT '========================================' as info;
SELECT '4. CURRENT INVENTORY' as info;
SELECT '========================================' as info;

SELECT 
    id,
    name,
    stock,
    msmeid,
    updatedat
FROM inventory;

-- Step 5: Check if there are accepted orders
SELECT '========================================' as info;
SELECT '5. ACCEPTED ORDERS' as info;
SELECT '========================================' as info;

SELECT 
    id,
    "buyerName",
    status,
    items,
    "createdAt",
    "updatedAt"
FROM orders
WHERE status = 'Accepted'
ORDER BY "updatedAt" DESC
LIMIT 5;

-- Step 6: Summary
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    inventory_count INTEGER;
    accepted_orders INTEGER;
BEGIN
    -- Check trigger
    SELECT EXISTS(
        SELECT 1 FROM information_schema.triggers
        WHERE trigger_name = 'order_acceptance_stock_trigger'
    ) INTO trigger_exists;
    
    -- Check function
    SELECT EXISTS(
        SELECT 1 FROM information_schema.routines
        WHERE routine_name = 'handle_order_acceptance'
    ) INTO function_exists;
    
    -- Count inventory
    SELECT COUNT(*) INTO inventory_count FROM inventory;
    
    -- Count accepted orders
    SELECT COUNT(*) INTO accepted_orders FROM orders WHERE status = 'Accepted';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Trigger: INSTALLED';
    ELSE
        RAISE NOTICE '❌ Trigger: NOT FOUND';
        RAISE NOTICE 'Action: Run COMPLETE-FIX-ALL.sql';
    END IF;
    
    IF function_exists THEN
        RAISE NOTICE '✅ Function: INSTALLED';
    ELSE
        RAISE NOTICE '❌ Function: NOT FOUND';
        RAISE NOTICE 'Action: Run COMPLETE-FIX-ALL.sql';
    END IF;
    
    RAISE NOTICE 'Inventory Items: %', inventory_count;
    RAISE NOTICE 'Accepted Orders: %', accepted_orders;
    
    RAISE NOTICE '========================================';
    
    IF NOT trigger_exists OR NOT function_exists THEN
        RAISE NOTICE '⚠️  TRIGGER NOT INSTALLED!';
        RAISE NOTICE '';
        RAISE NOTICE 'This is why stock is not updating.';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '  1. Run COMPLETE-FIX-ALL.sql in Supabase';
        RAISE NOTICE '  2. Refresh your browser';
        RAISE NOTICE '  3. Accept an order';
        RAISE NOTICE '  4. Stock will decrease automatically';
    ELSIF accepted_orders = 0 THEN
        RAISE NOTICE 'ℹ️  No accepted orders yet';
        RAISE NOTICE '';
        RAISE NOTICE 'Stock only decreases when:';
        RAISE NOTICE '  1. Order is placed (Pending)';
        RAISE NOTICE '  2. MSME accepts order (Accepted)';
        RAISE NOTICE '  3. Trigger fires automatically';
        RAISE NOTICE '  4. Stock decreases';
    ELSE
        RAISE NOTICE '✅ Everything looks good!';
        RAISE NOTICE '';
        RAISE NOTICE 'If stock is not updating:';
        RAISE NOTICE '  1. Check Supabase Logs for trigger messages';
        RAISE NOTICE '  2. Verify order contains inventory items';
        RAISE NOTICE '  3. Refresh browser to see updates';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
