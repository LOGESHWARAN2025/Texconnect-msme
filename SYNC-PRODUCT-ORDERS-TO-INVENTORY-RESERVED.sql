-- =====================================================
-- SYNC PRODUCT ORDERS TO INVENTORY RESERVED
-- =====================================================
-- When product name matches inventory name:
-- - Product order → Updates inventory reserved
-- - Available = Stock - Reserved
-- - Display in inventory table
-- =====================================================

-- Step 1: Ensure columns exist
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;

-- Step 2: Auto-link products to matching inventory
-- This creates recipes for products with matching inventory names
DO $$
DECLARE
    product_record RECORD;
    inventory_id UUID;
    linked_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔗 AUTO-LINKING PRODUCTS TO INVENTORY';
    RAISE NOTICE '========================================';
    
    FOR product_record IN 
        SELECT p.id, p.name
        FROM products p
        WHERE p.recipe IS NULL OR jsonb_array_length(p.recipe) = 0
    LOOP
        -- Find matching inventory by name
        SELECT i.id INTO inventory_id
        FROM inventory i
        WHERE LOWER(TRIM(i.name)) = LOWER(TRIM(product_record.name))
        LIMIT 1;
        
        IF inventory_id IS NOT NULL THEN
            -- Link product to inventory (1:1 ratio)
            UPDATE products
            SET recipe = jsonb_build_array(
                jsonb_build_object(
                    'inventoryId', inventory_id,
                    'quantity', 1
                )
            )
            WHERE id = product_record.id;
            
            linked_count := linked_count + 1;
            RAISE NOTICE '✅ Linked: Product "%" → Inventory', product_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total linked: % products', linked_count;
    RAISE NOTICE '========================================';
END $$;

-- Step 3: Create trigger to update inventory reserved based on orders
CREATE OR REPLACE FUNCTION sync_inventory_reserved_from_orders()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_id UUID;
    order_quantity INTEGER;
    product_recipe JSONB;
    inventory_id UUID;
    inventory_quantity INTEGER;
BEGIN
    -- ===================================================
    -- ORDER INSERTED (Placed)
    -- ===================================================
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE '📦 Order placed - Updating inventory reserved...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Update inventory reserved
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                inventory_id := (product_recipe->0->>'inventoryId')::UUID;
                inventory_quantity := (product_recipe->0->>'quantity')::INTEGER;
                
                UPDATE inventory
                SET reserved = COALESCE(reserved, 0) + (inventory_quantity * order_quantity)
                WHERE id = inventory_id;
                
                RAISE NOTICE '✅ Reserved % units in inventory', (inventory_quantity * order_quantity);
            END IF;
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    -- ===================================================
    -- ORDER DELETED
    -- ===================================================
    IF TG_OP = 'DELETE' THEN
        RAISE NOTICE '🗑️ Order deleted - Clearing inventory reserved...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                inventory_id := (product_recipe->0->>'inventoryId')::UUID;
                inventory_quantity := (product_recipe->0->>'quantity')::INTEGER;
                
                UPDATE inventory
                SET reserved = GREATEST(COALESCE(reserved, 0) - (inventory_quantity * order_quantity), 0)
                WHERE id = inventory_id;
                
                RAISE NOTICE '✅ Cleared % units from inventory reserved', (inventory_quantity * order_quantity);
            END IF;
        END LOOP;
        
        RETURN OLD;
    END IF;
    
    -- ===================================================
    -- ORDER STATUS CHANGED
    -- ===================================================
    IF TG_OP = 'UPDATE' THEN
        
        -- Order Accepted: Clear reserved, stock already deducted
        IF NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
            RAISE NOTICE '✅ Order accepted - Clearing reserved...';
            
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                SELECT recipe INTO product_recipe
                FROM products
                WHERE id = product_id;
                
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    inventory_id := (product_recipe->0->>'inventoryId')::UUID;
                    inventory_quantity := (product_recipe->0->>'quantity')::INTEGER;
                    
                    UPDATE inventory
                    SET reserved = GREATEST(COALESCE(reserved, 0) - (inventory_quantity * order_quantity), 0)
                    WHERE id = inventory_id;
                END IF;
            END LOOP;
        END IF;
        
        -- Order Cancelled: Clear reserved
        IF NEW.status = 'Cancelled' AND OLD.status = 'Pending' THEN
            RAISE NOTICE '❌ Order cancelled - Clearing reserved...';
            
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                SELECT recipe INTO product_recipe
                FROM products
                WHERE id = product_id;
                
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    inventory_id := (product_recipe->0->>'inventoryId')::UUID;
                    inventory_quantity := (product_recipe->0->>'quantity')::INTEGER;
                    
                    UPDATE inventory
                    SET reserved = GREATEST(COALESCE(reserved, 0) - (inventory_quantity * order_quantity), 0)
                    WHERE id = inventory_id;
                END IF;
            END LOOP;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Drop old trigger and create new one
DROP TRIGGER IF EXISTS sync_inventory_reserved_trigger ON orders;

CREATE TRIGGER sync_inventory_reserved_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_inventory_reserved_from_orders();

-- Step 5: Show linked products
SELECT 
    '✅ LINKED PRODUCTS' as info,
    p.name as product_name,
    i.name as inventory_name,
    p.recipe
FROM products p
LEFT JOIN inventory i ON i.id = (p.recipe->0->>'inventoryId')::UUID
WHERE p.recipe IS NOT NULL AND jsonb_array_length(p.recipe) > 0
ORDER BY p.name;

-- Step 6: Show current inventory status
SELECT 
    '📊 INVENTORY STATUS' as info,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;

-- Step 7: Test calculation
DO $$
DECLARE
    test_product RECORD;
    test_inventory RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 TEST CALCULATION';
    RAISE NOTICE '========================================';
    
    -- Get first linked product
    SELECT p.id, p.name, p.recipe INTO test_product
    FROM products p
    WHERE p.recipe IS NOT NULL AND jsonb_array_length(p.recipe) > 0
    LIMIT 1;
    
    IF test_product.id IS NOT NULL THEN
        -- Get linked inventory
        SELECT i.name, i.stock, COALESCE(i.reserved, 0) as reserved
        INTO test_inventory
        FROM inventory i
        WHERE i.id = (test_product.recipe->0->>'inventoryId')::UUID;
        
        RAISE NOTICE 'Product: %', test_product.name;
        RAISE NOTICE 'Linked Inventory: %', test_inventory.name;
        RAISE NOTICE '----------------------------------------';
        RAISE NOTICE 'Current Status:';
        RAISE NOTICE '  Stock: %', test_inventory.stock;
        RAISE NOTICE '  Reserved: %', test_inventory.reserved;
        RAISE NOTICE '  Available: %', (test_inventory.stock - test_inventory.reserved);
        RAISE NOTICE '----------------------------------------';
        RAISE NOTICE 'If order 5 units:';
        RAISE NOTICE '  Reserved will be: %', (test_inventory.reserved + 5);
        RAISE NOTICE '  Available will be: %', (test_inventory.stock - test_inventory.reserved - 5);
        RAISE NOTICE '========================================';
    ELSE
        RAISE NOTICE '⚠️ No linked products found!';
    END IF;
END $$;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SYSTEM READY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '  1. ✅ Linked products to matching inventory';
    RAISE NOTICE '  2. ✅ Created trigger for reserved updates';
    RAISE NOTICE '  3. ✅ Available = Stock - Reserved';
    RAISE NOTICE '';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '  Order placed → Reserved increases';
    RAISE NOTICE '  Order deleted → Reserved decreases';
    RAISE NOTICE '  Available updates automatically';
    RAISE NOTICE '';
    RAISE NOTICE 'Test it:';
    RAISE NOTICE '  1. Place order as Buyer';
    RAISE NOTICE '  2. Check Inventory menu';
    RAISE NOTICE '  3. Reserved column shows order quantity';
    RAISE NOTICE '  4. Available = Stock - Reserved';
    RAISE NOTICE '========================================';
END $$;
