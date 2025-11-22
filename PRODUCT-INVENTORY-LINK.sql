-- =====================================================
-- PRODUCT-INVENTORY LINK SYSTEM
-- =====================================================
-- This creates a system where products are linked to inventory items
-- When a product is ordered, both product stock AND inventory stock decrease
-- =====================================================

-- Step 1: Add recipe column to products table
-- Recipe stores which inventory items are needed to make this product
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;

-- Recipe format example:
-- [
--   {"inventoryId": "uuid-of-yarn", "quantity": 2},
--   {"inventoryId": "uuid-of-cotton", "quantity": 1}
-- ]

-- Step 2: Create enhanced trigger function
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
    -- Only process when status changes from Pending to Accepted
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
    
    -- If order is cancelled, restore stock (both product and inventory)
    IF NEW.status = 'Cancelled' AND OLD.status = 'Accepted' THEN
        
        RAISE NOTICE '🔄 Order cancelled, restoring stock...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Try products table
            UPDATE products
            SET 
                stock = stock + order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING recipe INTO product_recipe;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Restored product stock';
                
                -- Restore inventory items from recipe
                IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                    FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                    LOOP
                        inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                        inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                        total_inventory_needed := inventory_quantity * order_quantity;
                        
                        UPDATE inventory
                        SET 
                            stock = stock + total_inventory_needed,
                            updatedat = NOW()
                        WHERE id = inventory_id;
                        
                        RAISE NOTICE '✅ Restored inventory stock for item %', inventory_id;
                    END LOOP;
                END IF;
            ELSE
                -- Try inventory table
                UPDATE inventory
                SET 
                    stock = stock + order_quantity,
                    updatedat = NOW()
                WHERE id = product_id;
                
                IF FOUND THEN
                    RAISE NOTICE '✅ Restored inventory stock directly';
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop old trigger and create new one
DROP TRIGGER IF EXISTS order_acceptance_stock_trigger ON orders;

CREATE TRIGGER order_acceptance_stock_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_order_acceptance_with_inventory();

-- Step 4: Example - Link products to inventory
-- Run this for each product that uses inventory items

-- Example: Cotton Fabric product uses Yarn and Cotton from inventory
/*
UPDATE products
SET recipe = '[
    {"inventoryId": "uuid-of-yarn-inventory-item", "quantity": 2},
    {"inventoryId": "uuid-of-cotton-inventory-item", "quantity": 1}
]'::jsonb
WHERE id = 'uuid-of-cotton-fabric-product';
*/

-- Step 5: Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PRODUCT-INVENTORY LINK INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What this does:';
    RAISE NOTICE '  1. Products can have a "recipe" field';
    RAISE NOTICE '  2. Recipe lists inventory items needed';
    RAISE NOTICE '  3. When order accepted:';
    RAISE NOTICE '     - Product stock decreases';
    RAISE NOTICE '     - Inventory stock decreases (per recipe)';
    RAISE NOTICE '  4. When order cancelled:';
    RAISE NOTICE '     - Both stocks are restored';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Link products to inventory items';
    RAISE NOTICE '  2. Use the UI to set recipes';
    RAISE NOTICE '  3. Test by accepting an order';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Example recipe format:';
    RAISE NOTICE '[';
    RAISE NOTICE '  {"inventoryId": "uuid", "quantity": 2},';
    RAISE NOTICE '  {"inventoryId": "uuid", "quantity": 1}';
    RAISE NOTICE ']';
    RAISE NOTICE '========================================';
END $$;
