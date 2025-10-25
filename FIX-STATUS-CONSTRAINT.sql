-- =====================================================
-- FIX ORDER STATUS CONSTRAINT
-- =====================================================
-- The database has a constraint that only allows lowercase
-- We need to update it to allow capitalized values

-- =====================================================
-- STEP 1: Drop the old constraint
-- =====================================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- =====================================================
-- STEP 2: Update existing orders FIRST (before adding constraint)
-- =====================================================

UPDATE orders SET status = 'Pending' WHERE LOWER(status) = 'pending' OR status IS NULL;
UPDATE orders SET status = 'Shipped' WHERE LOWER(status) = 'shipped';
UPDATE orders SET status = 'Delivered' WHERE LOWER(status) = 'delivered';
UPDATE orders SET status = 'Cancelled' WHERE LOWER(status) = 'cancelled';

-- Set default for any NULL or invalid status
UPDATE orders SET status = 'Pending' WHERE status NOT IN ('Pending', 'Shipped', 'Delivered', 'Cancelled');

-- =====================================================
-- STEP 3: Add new constraint with capitalized values
-- =====================================================

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled'));

-- =====================================================
-- STEP 4: Verify
-- =====================================================

-- Check constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND conname = 'orders_status_check';

-- Check orders
SELECT id, "buyerName", status, date FROM orders ORDER BY date DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Status Constraint Fixed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Old constraint: status IN (pending, shipped, delivered, cancelled)';
    RAISE NOTICE 'New constraint: status IN (Pending, Shipped, Delivered, Cancelled)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All orders updated to use capitalized status';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh app and test status updates!';
    RAISE NOTICE '========================================';
END $$;
