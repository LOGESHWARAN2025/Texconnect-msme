-- =====================================================
-- AUTO RESERVE INVENTORY FROM PRODUCT ORDERS
-- =====================================================
-- When product stock decreases, automatically reserve inventory
-- Display reserved amount in inventory table
-- =====================================================

-- Step 1: Ensure required columns exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

-- Step 2: Create function to update inventory reservation
CREATE OR REPLACE FUNCTION update_inventory_reservation_from_orders()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_id UUID;
    order_quantity INTEGER;
    product_recipe JSONB;
    recipe_item RECORD;
    inventory_id UUID;
    inventory_quantity INTEGER;
    total_inventory_needed INTEGER;
BEGIN
    -- ===================================================
    -- WHEN ORDER IS INSERTED (Placed)
    -- Reserve inventory based on product recipe
    -- ===================================================
    IF TG_OP = 'INSERT' THEN
        RAISE NOTICE '🔄 Order placed - Reserving inventory...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Reserve inventory for each ingredient in recipe
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                LOOP
                    inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                    inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                    total_inventory_needed := inventory_quantity * order_quantity;
                    
                    -- Update inventory reserved
                    UPDATE inventory
                    SET reserved = COALESCE(reserved, 0) + total_inventory_needed
                    WHERE id = inventory_id;
                    
                    RAISE NOTICE '✅ Reserved % units of inventory % for product order', 
                        total_inventory_needed, inventory_id;
                END LOOP;
            END IF;
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    -- ===================================================
    -- WHEN ORDER IS DELETED
    -- Clear inventory reservation
    -- ===================================================
    IF TG_OP = 'DELETE' THEN
        RAISE NOTICE '🔄 Order deleted - Clearing inventory reservation...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Clear inventory reservation
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                LOOP
                    inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                    inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                    total_inventory_needed := inventory_quantity * order_quantity;
                    
                    -- Clear inventory reserved
                    UPDATE inventory
                    SET reserved = GREATEST(COALESCE(reserved, 0) - total_inventory_needed, 0)
                    WHERE id = inventory_id;
                    
                    RAISE NOTICE '✅ Cleared % units of inventory % reservation', 
                        total_inventory_needed, inventory_id;
                END LOOP;
            END IF;
        END LOOP;
        
        RETURN OLD;
    END IF;
    
    -- ===================================================
    -- WHEN ORDER STATUS CHANGES
    -- Handle Accepted/Cancelled status
    -- ===================================================
    IF TG_OP = 'UPDATE' THEN
        
        -- Order Accepted: Clear reservation, stock already deducted
        IF NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
            RAISE NOTICE '🔄 Order accepted - Clearing reservation (stock deducted)...';
            
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                SELECT recipe INTO product_recipe
                FROM products
                WHERE id = product_id;
                
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        -- Clear reservation (stock already deducted by other trigger)
                        UPDATE inventory
                        SET reserved = GREATEST(COALESCE(reserved, 0) - total_inventory_needed, 0)
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Cleared reservation for inventory %', inventory_id;
                    END LOOP;
                END IF;
            END LOOP;
        END IF;
        
        -- Order Cancelled: Clear reservation
        IF NEW.status = 'Cancelled' AND OLD.status = 'Pending' THEN
            RAISE NOTICE '🔄 Order cancelled - Clearing reservation...';
            
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                SELECT recipe INTO product_recipe
                FROM products
                WHERE id = product_id;
                
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        -- Clear reservation
                        UPDATE inventory
                        SET reserved = GREATEST(COALESCE(reserved, 0) - total_inventory_needed, 0)
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Cleared reservation for inventory %', inventory_id;
                    END LOOP;
                END IF;
            END LOOP;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop old trigger if exists
DROP TRIGGER IF EXISTS inventory_reservation_trigger ON orders;

-- Step 4: Create new trigger
CREATE TRIGGER inventory_reservation_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_reservation_from_orders();

-- Step 5: Verification query
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INVENTORY RESERVATION SYSTEM READY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '  1. Order placed → Inventory reserved';
    RAISE NOTICE '  2. Order accepted → Reservation cleared';
    RAISE NOTICE '  3. Order cancelled → Reservation cleared';
    RAISE NOTICE '  4. Order deleted → Reservation cleared';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Reserved column shows:';
    RAISE NOTICE '  - Inventory committed to pending orders';
    RAISE NOTICE '  - Available = Stock - Reserved';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANT: Link products to inventory!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Example:';
    RAISE NOTICE '  UPDATE products';
    RAISE NOTICE '  SET recipe = ''[';
    RAISE NOTICE '    {"inventoryId":"inv-id","quantity":2}';
    RAISE NOTICE '  ]''::jsonb';
    RAISE NOTICE '  WHERE id = ''product-id'';';
    RAISE NOTICE '========================================';
END $$;

-- Step 6: Show current inventory with reserved amounts
SELECT 
    '📊 CURRENT INVENTORY STATUS' as info,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;
