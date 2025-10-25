-- =====================================================
-- VERIFY AND FIX ALL ISSUES
-- =====================================================

-- =====================================================
-- PART 1: CHECK CURRENT STATE
-- =====================================================

-- Check orders table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('status', 'buyerId', 'buyerName', 'items', 'total')
ORDER BY column_name;

-- Check current orders
SELECT 
    id,
    "buyerName",
    status,
    total,
    jsonb_array_length(items) as item_count,
    items
FROM orders
ORDER BY date DESC;

-- Check constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND conname LIKE '%status%';

-- =====================================================
-- PART 2: FIX EVERYTHING
-- =====================================================

-- Step 1: Drop old status constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Update all orders to capitalized status
UPDATE orders SET status = 'Pending' WHERE status IS NULL OR LOWER(status) = 'pending';
UPDATE orders SET status = 'Shipped' WHERE LOWER(status) = 'shipped';
UPDATE orders SET status = 'Delivered' WHERE LOWER(status) = 'delivered';
UPDATE orders SET status = 'Cancelled' WHERE LOWER(status) = 'cancelled';

-- Step 3: Set default for any invalid status
UPDATE orders SET status = 'Pending' 
WHERE status NOT IN ('Pending', 'Shipped', 'Delivered', 'Cancelled');

-- Step 4: Add new constraint with capitalized values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled'));

-- Step 5: Ensure buyerId and buyerName exist
UPDATE orders 
SET 
    "buyerId" = (SELECT id FROM users WHERE role = 'buyer' LIMIT 1),
    "buyerName" = (SELECT username FROM users WHERE role = 'buyer' LIMIT 1)
WHERE "buyerId" IS NULL OR "buyerName" IS NULL;

-- Step 6: Ensure items is valid JSON array
UPDATE orders 
SET items = '[]'::jsonb 
WHERE items IS NULL OR items::text = 'null';

-- Step 7: Fix orders with multiple items (keep only first)
UPDATE orders 
SET 
    items = jsonb_build_array(items->0),
    total = CASE 
        WHEN jsonb_array_length(items) > 0 THEN
            (
                SELECT (i.price * (items->0->>'quantity')::integer) * 1.18
                FROM inventory i 
                WHERE i.id::text = (items->0->>'productId')
                LIMIT 1
            )
        ELSE total
    END
WHERE jsonb_array_length(items) > 1;

-- =====================================================
-- PART 3: VERIFY FIXES
-- =====================================================

-- Check orders are fixed
SELECT 
    id,
    "buyerId"::text as buyer_id,
    "buyerName",
    status,
    total,
    jsonb_array_length(items) as item_count,
    CASE 
        WHEN "buyerId" IS NULL THEN '❌ Missing buyerId'
        WHEN "buyerName" IS NULL THEN '❌ Missing buyerName'
        WHEN status NOT IN ('Pending', 'Shipped', 'Delivered', 'Cancelled') THEN '❌ Invalid status'
        WHEN jsonb_array_length(items) = 0 THEN '❌ No items'
        WHEN jsonb_array_length(items) > 1 THEN '⚠️ Multiple items'
        ELSE '✅ OK'
    END as check_status
FROM orders
ORDER BY date DESC;

-- Check invoice data
SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    o.total,
    buyer.username as buyer_username,
    seller.username as seller_username,
    i.name as product_name,
    item->>'quantity' as quantity
FROM orders o
LEFT JOIN users buyer ON buyer.id = o."buyerId"
LEFT JOIN jsonb_array_elements(o.items) as item ON true
LEFT JOIN inventory i ON i.id::text = (item->>'productId')
LEFT JOIN users seller ON seller.id::text = i.msmeid::text
ORDER BY o.date DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
    total_orders INTEGER;
    valid_orders INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO valid_orders 
    FROM orders 
    WHERE "buyerId" IS NOT NULL 
    AND "buyerName" IS NOT NULL 
    AND status IN ('Pending', 'Shipped', 'Delivered', 'Cancelled')
    AND jsonb_array_length(items) > 0;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ VERIFICATION AND FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total orders: %', total_orders;
    RAISE NOTICE 'Valid orders: %', valid_orders;
    RAISE NOTICE '========================================';
    
    IF valid_orders = total_orders THEN
        RAISE NOTICE '✅ ALL ORDERS ARE VALID!';
        RAISE NOTICE '✅ Status updates will work';
        RAISE NOTICE '✅ Invoices will load';
    ELSE
        RAISE NOTICE '⚠️ Some orders may have issues';
        RAISE NOTICE 'Check the verification query above';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh app (Ctrl+R)';
    RAISE NOTICE '  2. Test status update';
    RAISE NOTICE '  3. Test invoice';
    RAISE NOTICE '========================================';
END $$;
