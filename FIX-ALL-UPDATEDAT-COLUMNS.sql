-- =====================================================
-- FIX ALL TABLES - Add updatedAt and createdAt columns
-- =====================================================
-- This fixes the trigger error for all tables

-- =====================================================
-- 1. FIX PRODUCTS TABLE
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE products SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
UPDATE products SET "createdAt" = NOW() WHERE "createdAt" IS NULL;

-- =====================================================
-- 2. FIX INVENTORY TABLE
-- =====================================================

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE inventory SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
UPDATE inventory SET "createdAt" = NOW() WHERE "createdAt" IS NULL;

-- =====================================================
-- 3. FIX ORDERS TABLE (already done but ensure it's there)
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE orders SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
UPDATE orders SET "createdAt" = NOW() WHERE "createdAt" IS NULL;

-- =====================================================
-- 4. FIX USERS TABLE
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE users SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
UPDATE users SET "createdAt" = NOW() WHERE "createdAt" IS NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check products
SELECT 'Products' as table_name, 
       COUNT(*) as total,
       COUNT("updatedAt") as has_updatedat,
       COUNT("createdAt") as has_createdat
FROM products;

-- Check inventory
SELECT 'Inventory' as table_name, 
       COUNT(*) as total,
       COUNT("updatedAt") as has_updatedat,
       COUNT("createdAt") as has_createdat
FROM inventory;

-- Check orders
SELECT 'Orders' as table_name, 
       COUNT(*) as total,
       COUNT("updatedAt") as has_updatedat,
       COUNT("createdAt") as has_createdat
FROM orders;

-- Check users
SELECT 'Users' as table_name, 
       COUNT(*) as total,
       COUNT("updatedAt") as has_updatedat,
       COUNT("createdAt") as has_createdat
FROM users;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL TABLES FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added "updatedAt" and "createdAt" to:';
    RAISE NOTICE '  ✅ products';
    RAISE NOTICE '  ✅ inventory';
    RAISE NOTICE '  ✅ orders';
    RAISE NOTICE '  ✅ users';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Triggers will now work correctly!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '  ✅ Update products';
    RAISE NOTICE '  ✅ Update inventory';
    RAISE NOTICE '  ✅ Update orders';
    RAISE NOTICE '  ✅ Update users';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh your app (Ctrl+R)';
    RAISE NOTICE '========================================';
END $$;
