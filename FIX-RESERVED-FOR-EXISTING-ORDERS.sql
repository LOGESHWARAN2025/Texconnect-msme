-- =====================================================
-- FIX RESERVED FOR EXISTING ORDERS
-- =====================================================
-- This manually calculates and updates reserved for existing orders
-- Use this if orders were placed before trigger was installed
-- =====================================================

-- Step 1: Reset all reserved to 0
UPDATE inventory SET reserved = 0;

RAISE NOTICE 'Reset all reserved to 0';

-- Step 2: Calculate and update reserved based on pending orders
DO $$
DECLARE
    order_record RECORD;
    item RECORD;
    product_id UUID;
    product_name TEXT;
    inventory_name TEXT;
    order_quantity INTEGER;
    product_recipe JSONB;
    inventory_id UUID;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 CALCULATING RESERVED FROM ORDERS';
    RAISE NOTICE '========================================';
    
    -- Loop through all pending orders
    FOR order_record IN 
        SELECT id, items FROM orders WHERE status = 'Pending'
    LOOP
        RAISE NOTICE 'Processing Order: %', order_record.id;
        
        -- Loop through items in each order
        FOR item IN SELECT * FROM jsonb_array_elements(order_record.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product info
            SELECT name, recipe INTO product_name, product_recipe
            FROM products
            WHERE id = product_id;
            
            RAISE NOTICE '  Product: %, Quantity: %', product_name, order_quantity;
            
            -- Check if product has recipe (linked to inventory)
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                inventory_id := (product_recipe->0->>'inventoryId')::UUID;
                
                -- Get inventory name
                SELECT name INTO inventory_name
                FROM inventory
                WHERE id = inventory_id;
                
                -- Update reserved
                UPDATE inventory
                SET reserved = COALESCE(reserved, 0) + order_quantity
                WHERE id = inventory_id;
                
                updated_count := updated_count + 1;
                RAISE NOTICE '    ✅ Updated inventory "%": +% reserved', inventory_name, order_quantity;
            ELSE
                RAISE NOTICE '    ⚠️ Product not linked to inventory (no recipe)';
            END IF;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Updated % inventory items', updated_count;
    RAISE NOTICE '========================================';
END $$;

-- Step 3: Show updated inventory
SELECT 
    '✅ UPDATED INVENTORY' as info,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;

-- Step 4: Verify the calculation
DO $$
DECLARE
    total_pending_qty INTEGER;
    total_reserved INTEGER;
BEGIN
    -- Calculate total pending order quantity
    SELECT COALESCE(SUM((item.value->>'quantity')::INTEGER), 0)
    INTO total_pending_qty
    FROM orders o
    CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
    WHERE o.status = 'Pending';
    
    -- Get total reserved
    SELECT COALESCE(SUM(reserved), 0)
    INTO total_reserved
    FROM inventory;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 VERIFICATION';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total pending order quantity: %', total_pending_qty;
    RAISE NOTICE 'Total inventory reserved: %', total_reserved;
    
    IF total_reserved = total_pending_qty THEN
        RAISE NOTICE '✅ MATCH! Reserved is correct';
    ELSIF total_reserved = 0 AND total_pending_qty > 0 THEN
        RAISE NOTICE '⚠️ Products not linked to inventory';
        RAISE NOTICE 'Run: SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
    ELSE
        RAISE NOTICE 'ℹ️ Partial match (some products may not be linked)';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Final instructions
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 WHAT THIS SCRIPT DID';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Reset all reserved to 0';
    RAISE NOTICE '2. Calculated reserved from pending orders';
    RAISE NOTICE '3. Updated inventory reserved column';
    RAISE NOTICE '4. Verified the calculation';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Check inventory table in UI';
    RAISE NOTICE '2. Reserved should now show correct values';
    RAISE NOTICE '3. Available = Stock - Reserved';
    RAISE NOTICE '';
    RAISE NOTICE 'If reserved still shows 0:';
    RAISE NOTICE '→ Products not linked to inventory';
    RAISE NOTICE '→ Run: SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
    RAISE NOTICE '========================================';
END $$;
