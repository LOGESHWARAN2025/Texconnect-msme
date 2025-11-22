-- =====================================================
-- ADD BOUGHT COLUMN TO INVENTORY (SIMPLE VERSION)
-- =====================================================

-- Add bought column
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS bought INTEGER DEFAULT 0;

-- Verify it was added
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name = 'bought';

-- View sample data
SELECT 
    name,
    stock,
    bought
FROM inventory
LIMIT 5;

-- Success message
SELECT '✅ BOUGHT COLUMN ADDED SUCCESSFULLY!' as status;
