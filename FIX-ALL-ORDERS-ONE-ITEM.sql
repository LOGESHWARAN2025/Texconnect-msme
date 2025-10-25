-- =====================================================
-- FIX ALL ORDERS - ONE ITEM PER ORDER
-- =====================================================
-- This works for ALL existing orders automatically
-- No need to specify order IDs

-- =====================================================
-- STEP 1: Check current orders
-- =====================================================

SELECT 
    id,
    "buyerName",
    items,
    jsonb_array_length(items) as item_count,
    total
FROM orders
ORDER BY date DESC;

-- =====================================================
-- STEP 2: Fix ALL orders to have only first item
-- =====================================================

-- Update ALL orders to keep only the first item
UPDATE orders 
SET 
    items = jsonb_build_array(items->0),
    total = CASE 
        WHEN jsonb_array_length(items) > 0 THEN
            -- Calculate total for first item only
            (
                SELECT (i.price * (items->0->>'quantity')::integer) * 1.18
                FROM inventory i 
                WHERE i.id::text = (items->0->>'productId')
                LIMIT 1
            )
        ELSE total
    END
WHERE jsonb_array_length(items) > 1;  -- Only update orders with multiple items

-- =====================================================
-- STEP 3: Verify the fix
-- =====================================================

SELECT 
    id,
    "buyerName",
    items,
    jsonb_array_length(items) as item_count,
    total,
    items->0->>'productId' as product_id,
    items->0->>'quantity' as quantity
FROM orders
ORDER BY date DESC;

-- All orders should now have only 1 item

-- =====================================================
-- STEP 4: Check invoice data for all orders
-- =====================================================

SELECT 
    o.id as order_id,
    o."buyerName",
    o.total,
    jsonb_array_length(o.items) as item_count,
    item->>'productId' as product_id,
    item->>'quantity' as quantity,
    i.name as product_name,
    i.price,
    (i.price * (item->>'quantity')::integer) as subtotal,
    (i.price * (item->>'quantity')::integer * 1.18) as total_with_gst
FROM orders o,
jsonb_array_elements(o.items) as item
LEFT JOIN inventory i ON i.id::text = (item->>'productId')
ORDER BY o.date DESC;

-- Each order should show only 1 product

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
    total_orders INTEGER;
    fixed_orders INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orders FROM orders;
    SELECT COUNT(*) INTO fixed_orders FROM orders WHERE jsonb_array_length(items) = 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All Orders Fixed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total orders: %', total_orders;
    RAISE NOTICE 'Orders with 1 item: %', fixed_orders;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Each order now has only 1 item';
    RAISE NOTICE 'Each invoice will show only 1 item';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Refresh app and test invoices!';
    RAISE NOTICE '========================================';
END $$;
