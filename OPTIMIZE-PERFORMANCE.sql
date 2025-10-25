-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- =====================================================
-- PART 1: Add Database Indexes
-- =====================================================

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders("buyerId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_createdat ON orders(createdat);

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_msmeid ON products(msmeid);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_msmeid ON inventory(msmeid);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- PART 2: Analyze Tables for Query Optimization
-- =====================================================

ANALYZE orders;
ANALYZE products;
ANALYZE inventory;
ANALYZE users;

-- =====================================================
-- PART 3: Verify Indexes
-- =====================================================

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('orders', 'products', 'inventory', 'users')
ORDER BY tablename, indexname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PERFORMANCE OPTIMIZATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Indexes created:';
    RAISE NOTICE '  ✅ Orders: buyerId, status, date';
    RAISE NOTICE '  ✅ Products: msmeId, stock';
    RAISE NOTICE '  ✅ Inventory: msmeId, status';
    RAISE NOTICE '  ✅ Users: role, email';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Expected improvements:';
    RAISE NOTICE '  ⚡ Faster order queries';
    RAISE NOTICE '  ⚡ Faster product filtering';
    RAISE NOTICE '  ⚡ Faster dashboard loading';
    RAISE NOTICE '  ⚡ Faster status updates';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh app to see improvements!';
    RAISE NOTICE '========================================';
END $$;
