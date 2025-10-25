-- =====================================================
-- SIMPLE: DELETE ALL ORDERS
-- =====================================================

-- Show orders before deletion
SELECT 'BEFORE DELETION' as status, COUNT(*) as order_count FROM orders;

-- DELETE ALL ORDERS
DELETE FROM orders;

-- Show result
SELECT 'AFTER DELETION' as status, COUNT(*) as order_count FROM orders;

-- Success
SELECT '✅ ALL ORDERS DELETED!' as result;
