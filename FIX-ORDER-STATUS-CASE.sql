-- =====================================================
-- FIX ORDER STATUS - Capitalize First Letter
-- =====================================================

-- Check current status values
SELECT DISTINCT status FROM orders;

-- Update all status values to proper case
UPDATE orders SET status = 'Pending' WHERE LOWER(status) = 'pending';
UPDATE orders SET status = 'Shipped' WHERE LOWER(status) = 'shipped';
UPDATE orders SET status = 'Delivered' WHERE LOWER(status) = 'delivered';
UPDATE orders SET status = 'Cancelled' WHERE LOWER(status) = 'cancelled';

-- Verify
SELECT id, "buyerName", status, date FROM orders ORDER BY date DESC;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Order Status Fixed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All status values now use proper case:';
    RAISE NOTICE '  - Pending (not pending)';
    RAISE NOTICE '  - Shipped (not shipped)';
    RAISE NOTICE '  - Delivered (not delivered)';
    RAISE NOTICE '  - Cancelled (not cancelled)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh app and test status dropdown!';
    RAISE NOTICE '========================================';
END $$;
