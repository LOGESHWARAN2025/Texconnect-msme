-- =====================================================
-- FIX ALL INVENTORY COLUMNS
-- =====================================================
-- This ensures all required columns exist in inventory table
-- =====================================================

-- Step 1: Check current columns
SELECT 
    'CURRENT COLUMNS' as info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Step 2: Add missing columns (if they don't exist)
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS minstocklevel INTEGER DEFAULT 10;

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS bought INTEGER DEFAULT 0;

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS unitofmeasure TEXT DEFAULT 'unit';

-- Step 3: Verify all columns exist
SELECT 
    'AFTER FIX' as info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name IN ('minstocklevel', 'reserved', 'bought', 'status', 'unitofmeasure')
ORDER BY column_name;

-- Step 4: Show complete inventory table structure
SELECT 
    'COMPLETE INVENTORY STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Step 5: Test with sample data
SELECT 
    'SAMPLE DATA' as info,
    name,
    stock,
    reserved,
    bought,
    minstocklevel,
    unitofmeasure,
    status
FROM inventory
LIMIT 3;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ALL INVENTORY COLUMNS FIXED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Added/Verified columns:';
    RAISE NOTICE '  - minstocklevel (minimum stock level)';
    RAISE NOTICE '  - reserved (stock reserved for orders)';
    RAISE NOTICE '  - bought (total cost of purchases)';
    RAISE NOTICE '  - status (active/inactive)';
    RAISE NOTICE '  - unitofmeasure (kg, meter, etc)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now add/edit inventory items!';
    RAISE NOTICE '========================================';
END $$;
