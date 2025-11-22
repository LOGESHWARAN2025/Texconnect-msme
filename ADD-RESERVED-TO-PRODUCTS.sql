-- =====================================================
-- ADD RESERVED COLUMN TO PRODUCTS TABLE
-- =====================================================
-- This tracks how much product stock is reserved for pending orders
-- =====================================================

-- Step 1: Add reserved column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

-- Step 2: Verify column was added
SELECT 
    'PRODUCTS TABLE COLUMNS' as info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('stock', 'initialstock', 'reserved')
ORDER BY column_name;

-- Step 3: View sample data
SELECT 
    'SAMPLE PRODUCTS DATA' as info,
    name,
    stock,
    reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM products
LIMIT 5;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RESERVED COLUMN ADDED TO PRODUCTS!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Products table now has:';
    RAISE NOTICE '  - stock: Total product stock';
    RAISE NOTICE '  - reserved: Stock reserved for orders';
    RAISE NOTICE '  - available: stock - reserved';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '  When order is placed (Pending):';
    RAISE NOTICE '    reserved = reserved + order_quantity';
    RAISE NOTICE '  When order is accepted:';
    RAISE NOTICE '    stock = stock - order_quantity';
    RAISE NOTICE '    reserved = reserved - order_quantity';
    RAISE NOTICE '  When order is cancelled:';
    RAISE NOTICE '    reserved = reserved - order_quantity';
    RAISE NOTICE '========================================';
END $$;
