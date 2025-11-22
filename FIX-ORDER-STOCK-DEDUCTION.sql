-- =====================================================
-- FIX ORDER STOCK DEDUCTION
-- =====================================================
-- This ensures stock is deducted when order is PLACED
-- and restored when order is DELETED/CANCELLED
-- =====================================================

CREATE OR REPLACE FUNCTION handle_order_stock_changes()
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
    -- SCENARIO 1: ORDER CREATED (INSERT)
    -- Decrease product stock immediately when order is placed
    -- ===================================================
    IF TG_OP = 'INSERT' THEN
        
        RAISE NOTICE '🔄 New order placed, deducting stock...';
        RAISE NOTICE 'Order ID: %', NEW.id;
        
        -- Loop through all items in the order
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            RAISE NOTICE '📦 Processing item: Product ID = %, Quantity = %', product_id, order_quantity;
            
            -- Decrease product stock
            UPDATE products
            SET 
                stock = stock - order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING stock, recipe INTO new_stock, product_recipe;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Deducted product stock. New stock: %', new_stock;
                
                IF new_stock < 0 THEN
                    RAISE WARNING '⚠️ Product % stock is negative: %', product_id, new_stock;
                END IF;
                
                -- Also decrease inventory if product has recipe
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    RAISE NOTICE '🔧 Product has recipe with % ingredients', jsonb_array_length(product_recipe);
                    
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        -- Decrease inventory stock
                        UPDATE inventory
                        SET 
                            stock = stock - total_inventory_needed,
                            updatedat = NOW()
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Deducted inventory stock for item %', inventory_id;
                    END LOOP;
                END IF;
                
            ELSE
                RAISE WARNING '❌ Product % not found!', product_id;
            END IF;
        END LOOP;
        
        RAISE NOTICE '✅ Stock deduction complete for new order %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- ===================================================
    -- SCENARIO 2: ORDER DELETED
    -- Restore product stock when order is deleted
    -- ===================================================
    IF TG_OP = 'DELETE' THEN
        
        RAISE NOTICE '🔄 Order deleted, restoring stock...';
        RAISE NOTICE 'Order ID: %', OLD.id;
        
        -- Loop through all items in the order
        FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            RAISE NOTICE '📦 Restoring: Product ID = %, Quantity = %', product_id, order_quantity;
            
            -- Restore product stock
            UPDATE products
            SET 
                stock = stock + order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING stock, recipe INTO new_stock, product_recipe;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Restored product stock. New stock: %', new_stock;
                
                -- Also restore inventory if product has recipe
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    RAISE NOTICE '🔧 Restoring inventory from recipe';
                    
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        -- Restore inventory stock
                        UPDATE inventory
                        SET 
                            stock = stock + total_inventory_needed,
                            updatedat = NOW()
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Restored inventory stock for item %', inventory_id;
                    END LOOP;
                END IF;
                
            ELSE
                RAISE WARNING '❌ Product % not found!', product_id;
            END IF;
        END LOOP;
        
        RAISE NOTICE '✅ Stock restoration complete for deleted order %', OLD.id;
        RETURN OLD;
    END IF;
    
    -- ===================================================
    -- SCENARIO 3: ORDER CANCELLED (UPDATE to Cancelled status)
    -- Restore stock when order status changes to Cancelled
    -- ===================================================
    IF TG_OP = 'UPDATE' AND NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
        
        RAISE NOTICE '🔄 Order cancelled from status: %', OLD.status;
        RAISE NOTICE 'Order ID: %', NEW.id;
        
        -- Loop through all items in the order
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            RAISE NOTICE '📦 Restoring: Product ID = %, Quantity = %', product_id, order_quantity;
            
            -- Restore product stock
            UPDATE products
            SET 
                stock = stock + order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING stock, recipe INTO new_stock, product_recipe;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Restored product stock. New stock: %', new_stock;
                
                -- Also restore inventory if product has recipe
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        -- Restore inventory stock
                        UPDATE inventory
                        SET 
                            stock = stock + total_inventory_needed,
                            updatedat = NOW()
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Restored inventory stock for item %', inventory_id;
                    END LOOP;
                END IF;
            END IF;
        END LOOP;
        
        RAISE NOTICE '✅ Stock restoration complete for cancelled order %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS order_stock_on_insert ON orders;
DROP TRIGGER IF EXISTS order_stock_on_delete ON orders;
DROP TRIGGER IF EXISTS order_stock_on_cancel ON orders;

-- Create trigger for INSERT (order placed)
CREATE TRIGGER order_stock_on_insert
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_stock_changes();

-- Create trigger for DELETE (order deleted)
CREATE TRIGGER order_stock_on_delete
    BEFORE DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_stock_changes();

-- Create trigger for UPDATE (order cancelled)
CREATE TRIGGER order_stock_on_cancel
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'Cancelled' AND OLD.status IS DISTINCT FROM 'Cancelled')
    EXECUTE FUNCTION handle_order_stock_changes();

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ORDER STOCK TRIGGERS INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Handles ALL scenarios:';
    RAISE NOTICE '  1. Order PLACED → Stock decreases ✅';
    RAISE NOTICE '  2. Order DELETED → Stock increases ✅';
    RAISE NOTICE '  3. Order CANCELLED → Stock increases ✅';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Test it:';
    RAISE NOTICE '  1. Place an order → Check product stock';
    RAISE NOTICE '  2. Delete the order → Stock should restore';
    RAISE NOTICE '  3. Place order → Cancel it → Stock restores';
    RAISE NOTICE '========================================';
END $$;
