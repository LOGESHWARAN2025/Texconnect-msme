-- =====================================================
-- SETUP PRODUCT-INVENTORY RESERVATION SYSTEM
-- =====================================================
-- This links products to inventory and tracks reserved stock
-- =====================================================

-- Step 1: Add recipe column to products table
-- Recipe defines which inventory items are needed to make a product
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS recipe JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add reserved column to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

-- Step 3: Verify columns were added
SELECT 
    'PRODUCTS TABLE' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'recipe';

SELECT 
    'INVENTORY TABLE' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name = 'reserved';

-- Step 4: Create function to handle inventory reservation
CREATE OR REPLACE FUNCTION handle_inventory_reservation()
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
    -- SCENARIO 1: ORDER CREATED (INSERT)
    -- Reserve inventory for the product order
    -- ===================================================
    IF TG_OP = 'INSERT' AND NEW.status = 'Pending' THEN
        
        RAISE NOTICE '🔄 New order placed, reserving inventory...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Reserve inventory based on recipe
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                
                FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                LOOP
                    inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                    inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                    total_inventory_needed := inventory_quantity * order_quantity;
                    
                    -- Reserve inventory
                    UPDATE inventory
                    SET reserved = reserved + total_inventory_needed
                    WHERE id = inventory_id;
                    
                    RAISE NOTICE '✅ Reserved % units of inventory %', total_inventory_needed, inventory_id;
                END LOOP;
            END IF;
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    -- ===================================================
    -- SCENARIO 2: ORDER ACCEPTED
    -- Clear reservation and deduct actual stock
    -- ===================================================
    IF TG_OP = 'UPDATE' AND NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
        
        RAISE NOTICE '🔄 Order accepted, clearing reservation and deducting stock...';
        
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Clear reservation and deduct stock
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                
                FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                LOOP
                    inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                    inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                    total_inventory_needed := inventory_quantity * order_quantity;
                    
                    -- Clear reservation and deduct stock
                    UPDATE inventory
                    SET 
                        reserved = reserved - total_inventory_needed,
                        stock = stock - total_inventory_needed
                    WHERE id = inventory_id;
                    
                    RAISE NOTICE '✅ Cleared reservation and deducted stock for inventory %', inventory_id;
                END LOOP;
            END IF;
        END LOOP;
        
        RETURN NEW;
    END IF;
    
    -- ===================================================
    -- SCENARIO 3: ORDER CANCELLED OR DELETED
    -- Clear reservation (restore available stock)
    -- ===================================================
    IF (TG_OP = 'UPDATE' AND NEW.status = 'Cancelled' AND OLD.status = 'Pending') 
       OR (TG_OP = 'DELETE' AND OLD.status = 'Pending') THEN
        
        RAISE NOTICE '🔄 Order cancelled/deleted, clearing reservation...';
        
        -- Use OLD for DELETE, NEW for UPDATE
        FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(OLD.items, NEW.items))
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product recipe
            SELECT recipe INTO product_recipe
            FROM products
            WHERE id = product_id;
            
            -- Clear reservation
            IF product_recipe IS NOT NULL AND jsonb_array_length(product_recipe) > 0 THEN
                
                FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
                LOOP
                    inventory_id := (recipe_item.value->>'inventoryId')::UUID;
                    inventory_quantity := (recipe_item.value->>'quantity')::INTEGER;
                    total_inventory_needed := inventory_quantity * order_quantity;
                    
                    -- Clear reservation
                    UPDATE inventory
                    SET reserved = reserved - total_inventory_needed
                    WHERE id = inventory_id;
                    
                    RAISE NOTICE '✅ Cleared reservation for inventory %', inventory_id;
                END LOOP;
            END IF;
        END LOOP;
        
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers if they exist
DROP TRIGGER IF EXISTS inventory_reservation_trigger ON orders;

-- Create trigger for inventory reservation
CREATE TRIGGER inventory_reservation_trigger
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_reservation();

-- Step 5: Example - Link a product to inventory
-- Uncomment and modify to link your products to inventory

/*
-- Example: Cotton Fabric uses Cotton and Dye
UPDATE products
SET recipe = '[
    {"inventoryId": "cotton-inventory-id-here", "quantity": 2},
    {"inventoryId": "dye-inventory-id-here", "quantity": 1}
]'::jsonb
WHERE name = 'Cotton Fabric';

-- To find inventory IDs:
SELECT id, name FROM inventory WHERE msmeid = 'your-msme-id';

-- To find product IDs:
SELECT id, name FROM products WHERE msmeid = 'your-msme-id';
*/

-- Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INVENTORY RESERVATION SYSTEM INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  1. Products can have recipes (link to inventory)';
    RAISE NOTICE '  2. Inventory shows reserved stock';
    RAISE NOTICE '  3. Available = Stock - Reserved';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Link products to inventory using recipes';
    RAISE NOTICE '  2. Place an order';
    RAISE NOTICE '  3. Check inventory reserved column';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Example Recipe:';
    RAISE NOTICE '  Product: Cotton Fabric';
    RAISE NOTICE '  Recipe: [';
    RAISE NOTICE '    {inventoryId: "abc", quantity: 2},  ← 2 kg Cotton';
    RAISE NOTICE '    {inventoryId: "xyz", quantity: 1}   ← 1 L Dye';
    RAISE NOTICE '  ]';
    RAISE NOTICE '========================================';
END $$;
