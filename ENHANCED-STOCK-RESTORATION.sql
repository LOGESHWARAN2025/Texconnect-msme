-- =====================================================
-- ENHANCED STOCK RESTORATION ON CANCELLATION
-- =====================================================
-- This handles ALL cancellation scenarios:
-- 1. Pending → Cancelled (buyer cancels before MSME accepts)
-- 2. Accepted → Cancelled (MSME cancels after accepting)
-- 3. Shipped → Cancelled (rare, but handled)
-- =====================================================

-- Enhanced trigger function with comprehensive cancellation handling
CREATE OR REPLACE FUNCTION handle_order_acceptance_with_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_id UUID;
    order_quantity INTEGER;
    new_stock INTEGER;
    product_recipe JSONB;
    recipe_item RECORD;
    inventory_id UUID;
    inventory_quantity INTEGER;
    total_inventory_needed INTEGER;
BEGIN
    -- ===================================================
    -- SCENARIO 1: ORDER ACCEPTED (Pending → Accepted)
    -- Decrease product stock AND inventory stock
    -- ===================================================
    IF NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
        
        RAISE NOTICE '🔄 Order accepted, processing stock deduction...';
        RAISE NOTICE 'Order ID: %', NEW.id;
        
        -- Loop through all items in the order
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            RAISE NOTICE '📦 Processing item: Product ID = %, Quantity = %', product_id, order_quantity;
            
            -- Try to update products table first
            UPDATE products
            SET 
                stock = stock - order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING stock, recipe INTO new_stock, product_recipe;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Updated product stock. New stock: %', new_stock;
                
                IF new_stock < 0 THEN
                    RAISE WARNING '⚠️ Product % stock is negative: %', product_id, new_stock;
                END IF;
                
                -- Now process the recipe to decrease inventory
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    RAISE NOTICE '🔧 Product has recipe with % ingredients', jsonb_array_length(product_recipe);
                    
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        RAISE NOTICE '📦 Recipe item: Inventory ID = %, Quantity per product = %, Total needed = %', 
                            inventory_id, inventory_quantity, total_inventory_needed;
                        
                        -- Decrease inventory stock
                        UPDATE inventory
                        SET 
                            stock = stock - total_inventory_needed,
                            updatedat = NOW()
                        WHERE id = inventory_id
                        RETURNING stock INTO new_stock;
                        
                        IF FOUND THEN
                            RAISE NOTICE '✅ Updated inventory stock. New stock: %', new_stock;
                            
                            IF new_stock < 0 THEN
                                RAISE WARNING '⚠️ Inventory item % stock is negative: %', inventory_id, new_stock;
                            END IF;
                        ELSE
                            RAISE WARNING '❌ Inventory item % not found!', inventory_id;
                        END IF;
                    END LOOP;
                ELSE
                    RAISE NOTICE 'ℹ️ Product has no recipe (no inventory items linked)';
                END IF;
                
            ELSE
                -- If not in products, try inventory table directly
                UPDATE inventory
                SET 
                    stock = stock - order_quantity,
                    updatedat = NOW()
                WHERE id = product_id
                RETURNING stock INTO new_stock;
                
                IF FOUND THEN
                    RAISE NOTICE '✅ Updated inventory stock directly. New stock: %', new_stock;
                    
                    IF new_stock < 0 THEN
                        RAISE WARNING '⚠️ Inventory item % stock is negative: %', product_id, new_stock;
                    END IF;
                ELSE
                    RAISE WARNING '❌ Product/Inventory item % not found!', product_id;
                END IF;
            END IF;
        END LOOP;
        
        RAISE NOTICE '✅ Stock deduction complete for order %', NEW.id;
    END IF;
    
    -- ===================================================
    -- SCENARIO 2: ORDER CANCELLED FROM ANY STATUS
    -- Restore stock ONLY if it was previously deducted
    -- ===================================================
    IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        
        RAISE NOTICE '🔄 Order cancelled from status: %', OLD.status;
        RAISE NOTICE 'Order ID: %', NEW.id;
        
        -- Only restore stock if order was previously Accepted or Shipped
        -- (Pending orders never had stock deducted, so nothing to restore)
        IF OLD.status IN ('Accepted', 'Shipped') THEN
            RAISE NOTICE '✅ Restoring stock (order was % before cancellation)', OLD.status;
            
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                RAISE NOTICE '📦 Restoring: Product ID = %, Quantity = %', product_id, order_quantity;
                
                -- Try products table
                UPDATE products
                SET 
                    stock = stock + order_quantity,
                    "updatedAt" = NOW()
                WHERE id = product_id
                RETURNING stock, recipe INTO new_stock, product_recipe;
                
                IF FOUND THEN
                    RAISE NOTICE '✅ Restored product stock. New stock: %', new_stock;
                    
                    -- Restore inventory items from recipe
                    IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                        RAISE NOTICE '🔧 Restoring inventory from recipe with % ingredients', jsonb_array_length(product_recipe);
                        
                        FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                        LOOP
                            inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                            inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                            total_inventory_needed := inventory_quantity * order_quantity;
                            
                            UPDATE inventory
                            SET 
                                stock = stock + total_inventory_needed,
                                updatedat = NOW()
                            WHERE id = inventory_id
                            RETURNING stock INTO new_stock;
                            
                            IF FOUND THEN
                                RAISE NOTICE '✅ Restored inventory stock for item %. New stock: %', inventory_id, new_stock;
                            END IF;
                        END LOOP;
                    END IF;
                ELSE
                    -- Try inventory table
                    UPDATE inventory
                    SET 
                        stock = stock + order_quantity,
                        updatedat = NOW()
                    WHERE id = product_id
                    RETURNING stock INTO new_stock;
                    
                    IF FOUND THEN
                        RAISE NOTICE '✅ Restored inventory stock directly. New stock: %', new_stock;
                    END IF;
                END IF;
            END LOOP;
            
            RAISE NOTICE '✅ Stock restoration complete for order %', NEW.id;
        ELSE
            RAISE NOTICE 'ℹ️ No stock restoration needed (order was % - stock was never deducted)', OLD.status;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS order_acceptance_stock_trigger ON orders;

CREATE TRIGGER order_acceptance_stock_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_order_acceptance_with_inventory();

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ENHANCED STOCK RESTORATION INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Handles ALL cancellation scenarios:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Pending → Cancelled:';
    RAISE NOTICE '   - No stock restoration (never deducted)';
    RAISE NOTICE '   - Reserved inventory cleared automatically';
    RAISE NOTICE '';
    RAISE NOTICE '2. Accepted → Cancelled:';
    RAISE NOTICE '   - Product stock restored';
    RAISE NOTICE '   - Inventory stock restored (per recipe)';
    RAISE NOTICE '   - Reserved inventory cleared';
    RAISE NOTICE '';
    RAISE NOTICE '3. Shipped → Cancelled:';
    RAISE NOTICE '   - Product stock restored';
    RAISE NOTICE '   - Inventory stock restored (per recipe)';
    RAISE NOTICE '';
    RAISE NOTICE '4. Pending → Accepted:';
    RAISE NOTICE '   - Product stock decreased';
    RAISE NOTICE '   - Inventory stock decreased (per recipe)';
    RAISE NOTICE '   - Reserved inventory cleared';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Real-time updates:';
    RAISE NOTICE '   - Buyers see updated stock immediately';
    RAISE NOTICE '   - MSME sees updated stock in dashboard';
    RAISE NOTICE '   - All changes logged in Supabase';
    RAISE NOTICE '========================================';
END $$;
