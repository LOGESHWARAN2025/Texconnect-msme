-- =====================================================
-- VERIFY ORDERS TABLE SETUP
-- =====================================================
-- Run this to check if orders table is properly configured
-- =====================================================

-- Check 1: Table exists and structure
SELECT '========================================' as info;
SELECT '1. ORDERS TABLE STRUCTURE' as info;
SELECT '========================================' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Check 2: Triggers
SELECT '========================================' as info;
SELECT '2. TRIGGERS ON ORDERS TABLE' as info;
SELECT '========================================' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- Check 3: RLS Policies
SELECT '========================================' as info;
SELECT '3. RLS POLICIES' as info;
SELECT '========================================' as info;

SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- Check 4: Indexes
SELECT '========================================' as info;
SELECT '4. INDEXES' as info;
SELECT '========================================' as info;

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'orders';

-- Check 5: Current orders data
SELECT '========================================' as info;
SELECT '5. CURRENT ORDERS (if any)' as info;
SELECT '========================================' as info;

SELECT 
    id,
    "buyerName",
    "itemName",
    status,
    "totalAmount",
    "createdAt",
    "updatedAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 5;

-- Check 6: Realtime publication
SELECT '========================================' as info;
SELECT '6. REALTIME PUBLICATION' as info;
SELECT '========================================' as info;

SELECT 
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'orders';

-- Summary
SELECT '========================================' as info;
SELECT 'VERIFICATION COMPLETE' as info;
SELECT '========================================' as info;

DO $$ 
DECLARE
    trigger_count INTEGER;
    policy_count INTEGER;
    realtime_enabled BOOLEAN;
BEGIN
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE event_object_table = 'orders';
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'orders';
    
    -- Check realtime
    SELECT EXISTS(
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'orders'
    ) INTO realtime_enabled;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUMMARY:';
    RAISE NOTICE '========================================';
    
    IF trigger_count > 0 THEN
        RAISE NOTICE '✅ Triggers: % found', trigger_count;
    ELSE
        RAISE NOTICE '❌ Triggers: NONE - Run FIX-ORDERS-REALTIME.sql';
    END IF;
    
    IF policy_count >= 7 THEN
        RAISE NOTICE '✅ RLS Policies: % found', policy_count;
    ELSE
        RAISE NOTICE '⚠️  RLS Policies: Only % found (expected 7+)', policy_count;
    END IF;
    
    IF realtime_enabled THEN
        RAISE NOTICE '✅ Realtime: ENABLED';
    ELSE
        RAISE NOTICE '❌ Realtime: NOT ENABLED - Run FIX-ORDERS-REALTIME.sql';
    END IF;
    
    RAISE NOTICE '========================================';
    
    IF trigger_count > 0 AND policy_count >= 7 AND realtime_enabled THEN
        RAISE NOTICE '🎉 ALL CHECKS PASSED!';
        RAISE NOTICE 'Orders table is properly configured.';
    ELSE
        RAISE NOTICE '⚠️  ISSUES FOUND!';
        RAISE NOTICE 'Please run FIX-ORDERS-REALTIME.sql';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
