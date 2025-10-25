-- =====================================================
-- ADD "ACCEPTED" STATUS
-- =====================================================

-- =====================================================
-- STEP 1: Drop old constraint
-- =====================================================

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- =====================================================
-- STEP 2: Add new constraint with "Accepted" status
-- =====================================================

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'));

-- =====================================================
-- STEP 3: Verify
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
    RAISE NOTICE '✅ Accepted Status Added!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Status flow:';
    RAISE NOTICE '  1. Pending   → Order placed';
    RAISE NOTICE '  2. Accepted  → MSME accepted order';
    RAISE NOTICE '  3. Shipped   → Order shipped (Invoice available)';
    RAISE NOTICE '  4. Delivered → Order delivered';
    RAISE NOTICE '  5. Cancelled → Order cancelled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Invoice will show only for:';
    RAISE NOTICE '  ✅ Shipped';
    RAISE NOTICE '  ✅ Delivered';
    RAISE NOTICE '  ❌ Pending (no invoice)';
    RAISE NOTICE '  ❌ Accepted (no invoice)';
    RAISE NOTICE '========================================';
END $$;
