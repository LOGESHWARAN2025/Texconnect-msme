-- =====================================================
-- TEST INVENTORY STOCK DEDUCTION
-- =====================================================
-- This tests if inventory stock decreases when orders are accepted
-- =====================================================

-- Step 1: Check current inventory
SELECT '========================================' as step;
SELECT '1. CURRENT INVENTORY STOCK' as step;
SELECT '========================================' as step;

SELECT 
    id,
    name,
    stock,
    msmeid,
    updatedat
FROM inventory
ORDER BY updatedat DESC
LIMIT 10;

-- Step 2: Check if any orders contain inventory items
SELECT '========================================' as step;
SELECT '2. ORDERS WITH INVENTORY ITEMS' as step;
SELECT '========================================' as step;

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item.value->>'productId' as item_id,
    item.value->>'productName' as item_name,
    item.value->>'quantity' as quantity,
    CASE 
        WHEN EXISTS (SELECT 1 FROM products p WHERE p.id = (item.value->>'productId')::UUID) THEN 'Product'
        WHEN EXISTS (SELECT 1 FROM inventory i WHERE i.id = (item.value->>'productId')::UUID) THEN 'Inventory'
        ELSE 'Not Found'
    END as item_type
FROM orders o
CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
LIMIT 10;

-- Step 3: Simulate order acceptance for inventory item
SELECT '========================================' as step;
SELECT '3. TEST INVENTORY STOCK DEDUCTION' as step;
SELECT '========================================' as step;

DO $$
DECLARE
    test_inventory_id UUID;
    test_inventory_name TEXT;
    old_stock INTEGER;
    new_stock INTEGER;
    test_order_id UUID;
BEGIN
    -- Get first inventory item
    SELECT id, name, stock 
    INTO test_inventory_id, test_inventory_name, old_stock
    FROM inventory
    LIMIT 1;
    
    IF test_inventory_id IS NULL THEN
        RAISE NOTICE '❌ No inventory items found!';
        RAISE NOTICE 'Action: Create inventory items in MSME dashboard';
        RETURN;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Testing with inventory item:';
    RAISE NOTICE '  Name: %', test_inventory_name;
    RAISE NOTICE '  ID: %', test_inventory_id;
    RAISE NOTICE '  Current Stock: %', old_stock;
    RAISE NOTICE '========================================';
    
    -- Create a test order with this inventory item
    INSERT INTO orders (
        "buyerId",
        "buyerName",
        "itemName",
        items,
        "totalAmount",
        status
    )
    SELECT 
        u.id,
        u.username,
        test_inventory_name,
        jsonb_build_array(
            jsonb_build_object(
                'productId', test_inventory_id,
                'productName', test_inventory_name,
                'quantity', 5,
                'price', 100
            )
        ),
        500,
        'Pending'
    FROM users u
    WHERE u.role = 'buyer'
    LIMIT 1
    RETURNING id INTO test_order_id;
    
    IF test_order_id IS NULL THEN
        RAISE NOTICE '❌ Could not create test order (no buyer found)';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Test order created: %', test_order_id;
    RAISE NOTICE 'Status: Pending';
    
    -- Check stock (should be unchanged)
    SELECT stock INTO new_stock FROM inventory WHERE id = test_inventory_id;
    RAISE NOTICE 'Stock after order placement: % (should be %)', new_stock, old_stock;
    
    -- Now accept the order (this should trigger stock deduction)
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'Accepting order...';
    
    UPDATE orders
    SET status = 'Accepted'
    WHERE id = test_order_id;
    
    -- Check stock again (should be decreased)
    SELECT stock INTO new_stock FROM inventory WHERE id = test_inventory_id;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTS:';
    RAISE NOTICE '  Old Stock: %', old_stock;
    RAISE NOTICE '  New Stock: %', new_stock;
    RAISE NOTICE '  Expected: %', old_stock - 5;
    RAISE NOTICE '========================================';
    
    IF new_stock = old_stock - 5 THEN
        RAISE NOTICE '✅ SUCCESS! Inventory stock decreased correctly!';
    ELSE
        RAISE NOTICE '❌ FAILED! Stock did not decrease!';
        RAISE NOTICE 'Expected: %, Got: %', old_stock - 5, new_stock;
    END IF;
    
    -- Clean up test order
    DELETE FROM orders WHERE id = test_order_id;
    RAISE NOTICE '🧹 Test order cleaned up';
    
    -- Restore stock
    UPDATE inventory SET stock = old_stock WHERE id = test_inventory_id;
    RAISE NOTICE '🔄 Stock restored to original value';
    
    RAISE NOTICE '========================================';
END $$;

-- Step 4: Summary
DO $$
DECLARE
    inventory_count INTEGER;
    product_count INTEGER;
    order_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO inventory_count FROM inventory;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO order_count FROM orders;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATABASE SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inventory Items: %', inventory_count;
    RAISE NOTICE 'Products: %', product_count;
    RAISE NOTICE 'Orders: %', order_count;
    RAISE NOTICE '========================================';
    
    IF inventory_count = 0 THEN
        RAISE NOTICE '⚠️  No inventory items!';
        RAISE NOTICE 'Action: Add inventory items in MSME dashboard';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANT NOTES:';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Inventory items CAN be ordered by buyers';
    RAISE NOTICE '2. Stock decreases when order is ACCEPTED';
    RAISE NOTICE '3. Stock is restored if accepted order is CANCELLED';
    RAISE NOTICE '4. Updates are visible in real-time';
    RAISE NOTICE '========================================';
END $$;
