-- =====================================================
-- ENABLE REALTIME UPDATES
-- =====================================================

-- =====================================================
-- PART 1: Check Current Realtime Status
-- =====================================================

-- Check which tables have realtime enabled
SELECT 
    schemaname,
    tablename,
    (SELECT count(*) 
     FROM pg_publication_tables 
     WHERE tablename = t.tablename 
     AND pubname = 'supabase_realtime') as is_realtime_enabled
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('orders', 'products', 'inventory', 'feedback', 'users')
ORDER BY tablename;

-- =====================================================
-- PART 2: Enable Realtime for All Tables
-- =====================================================

-- Note: We use DO block to handle "already exists" errors gracefully

DO $$
BEGIN
    -- Enable realtime publication for orders
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE orders;
        RAISE NOTICE '✅ Added orders to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ orders already in realtime';
    END;

    -- Enable realtime publication for products
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
        RAISE NOTICE '✅ Added products to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ products already in realtime';
    END;

    -- Enable realtime publication for inventory
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
        RAISE NOTICE '✅ Added inventory to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ inventory already in realtime';
    END;

    -- Enable realtime publication for feedback
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE feedback;
        RAISE NOTICE '✅ Added feedback to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ feedback already in realtime';
    END;

    -- Enable realtime publication for users
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
        RAISE NOTICE '✅ Added users to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ users already in realtime';
    END;

    -- Enable realtime publication for issues
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE issues;
        RAISE NOTICE '✅ Added issues to realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ issues already in realtime';
    END;
END $$;

-- =====================================================
-- PART 3: Verify Realtime is Enabled
-- =====================================================

-- Check again after enabling
SELECT 
    tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE tablename = t.tablename 
            AND pubname = 'supabase_realtime'
        ) THEN '✅ Enabled'
        ELSE '❌ Not Enabled'
    END as realtime_status
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN ('orders', 'products', 'inventory', 'feedback', 'users', 'issues')
ORDER BY tablename;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ REALTIME UPDATES ENABLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Realtime enabled for:';
    RAISE NOTICE '  ✅ orders';
    RAISE NOTICE '  ✅ products';
    RAISE NOTICE '  ✅ inventory';
    RAISE NOTICE '  ✅ feedback';
    RAISE NOTICE '  ✅ users';
    RAISE NOTICE '  ✅ issues';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Changes will now update automatically!';
    RAISE NOTICE 'No need to refresh page manually.';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test:';
    RAISE NOTICE '  1. Open two browser windows';
    RAISE NOTICE '  2. Make a change in one window';
    RAISE NOTICE '  3. See update in other window (1-2 sec)';
    RAISE NOTICE '========================================';
END $$;
