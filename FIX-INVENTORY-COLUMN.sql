-- =====================================================
-- FIX INVENTORY TABLE - Add missing column
-- =====================================================

-- Check current columns
SELECT 
    'CURRENT COLUMNS' as check_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Add missing minStockLevel column
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS minstocklevel INTEGER DEFAULT 10;

-- Verify column was added
SELECT 
    'AFTER FIX' as check_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name = 'minstocklevel';

-- Show inventory table structure
SELECT 
    'INVENTORY TABLE STRUCTURE' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ minStockLevel column added to inventory table';
    RAISE NOTICE 'You can now save inventory items!';
END $$;
