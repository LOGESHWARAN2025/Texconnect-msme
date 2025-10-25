-- =====================================================
-- COMPLETE FIX FOR ORDERS TABLE
-- =====================================================

-- Step 1: Check current columns
SELECT 'CURRENT COLUMNS' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Step 2: Drop and recreate orders table with correct structure
DROP TABLE IF EXISTS orders CASCADE;

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "buyerId" UUID NOT NULL,
    "buyerName" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    items JSONB NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create index for better performance
CREATE INDEX idx_orders_buyerid ON orders("buyerId");
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_createdat ON orders("createdAt");

-- Step 4: Verify table structure
SELECT 'NEW TABLE STRUCTURE' as step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ORDERS TABLE RECREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Columns:';
    RAISE NOTICE '  - id (UUID)';
    RAISE NOTICE '  - buyerId (UUID)';
    RAISE NOTICE '  - buyerName (TEXT)';
    RAISE NOTICE '  - itemName (TEXT)';
    RAISE NOTICE '  - items (JSONB)';
    RAISE NOTICE '  - totalAmount (DECIMAL)';
    RAISE NOTICE '  - status (TEXT)';
    RAISE NOTICE '  - createdAt (TIMESTAMP)';
    RAISE NOTICE '  - updatedAt (TIMESTAMP)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Now refresh browser and place order!';
    RAISE NOTICE '========================================';
END $$;
