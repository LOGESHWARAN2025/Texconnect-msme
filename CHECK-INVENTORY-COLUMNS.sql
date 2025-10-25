-- =====================================================
-- CHECK INVENTORY TABLE COLUMN NAMES
-- =====================================================

-- Check what columns exist in inventory table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'inventory'
ORDER BY ordinal_position;

-- Check sample data
SELECT * FROM inventory LIMIT 3;

-- =====================================================
-- RESULTS INTERPRETATION
-- =====================================================

/*
Look for the supplier ID column name:
- Could be: supplierid (lowercase)
- Could be: supplierId (camelCase)  
- Could be: msmeid (like products table)
- Could be: msmeId (camelCase)

Once you know the correct name, we'll update the sync script.
*/
