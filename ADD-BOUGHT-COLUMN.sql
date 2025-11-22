-- =====================================================
-- ADD BOUGHT COLUMN TO INVENTORY
-- =====================================================
-- This adds a "bought" column to track purchased inventory
-- =====================================================

-- Step 1: Add bought column to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS bought INTEGER DEFAULT 0;

-- Step 2: Set initial values (optional - set to current stock)
-- Uncomment if you want to initialize bought = stock
-- UPDATE inventory SET bought = stock WHERE bought = 0;

-- Step 3: Verify column was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name IN ('stock', 'bought')
ORDER BY ordinal_position;

-- Step 4: View sample data
SELECT 
    id,
    name,
    stock,
    bought
FROM inventory
LIMIT 5;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ BOUGHT COLUMN ADDED TO INVENTORY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Column structure:';
    RAISE NOTICE '  - stock: Total inventory in warehouse';
    RAISE NOTICE '  - bought: Total purchased/bought';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '  When you buy inventory:';
    RAISE NOTICE '    UPDATE inventory';
    RAISE NOTICE '    SET stock = stock + 100,';
    RAISE NOTICE '        bought = bought + 100';
    RAISE NOTICE '    WHERE id = ''inventory-id'';';
    RAISE NOTICE '========================================';
END $$;
