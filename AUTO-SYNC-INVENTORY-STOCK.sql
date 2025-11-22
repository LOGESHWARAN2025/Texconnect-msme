-- =====================================================
-- AUTO-SYNC INVENTORY STOCK WITH ORDERS
-- =====================================================
-- This automatically updates inventory stock based on:
-- Inventory Stock = Product Stock - Total Ordered Quantity
-- =====================================================

-- Step 1: Create function to calculate total ordered quantity for a product
CREATE OR REPLACE FUNCTION get_total_ordered_quantity(product_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    total_ordered INTEGER;
BEGIN
    -- Sum all quantities from orders where status is Pending or Accepted
    SELECT COALESCE(SUM((item.value->>'quantity')::INTEGER), 0)
    INTO total_ordered
    FROM orders o
    CROSS JOIN LATERAL jsonb_array_elements(o.items) as item
    WHERE (item.value->>'productId')::UUID = product_uuid
    AND o.status IN ('Pending', 'Accepted', 'Shipped');
    
    RETURN total_ordered;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create function to sync inventory stock with product stock
CREATE OR REPLACE FUNCTION sync_inventory_with_product_stock()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
    total_ordered INTEGER;
    available_stock INTEGER;
    recipe_item RECORD;
    inventory_id UUID;
    inventory_quantity INTEGER;
BEGIN
    -- This trigger fires when orders table changes
    -- We need to update inventory for all products in the order
    
    RAISE NOTICE '🔄 Syncing inventory stock with product stock...';
    
    -- Loop through all items in the order
    FOR product_record IN 
        SELECT DISTINCT (item.value->>'productId')::UUID as product_id
        FROM jsonb_array_elements(NEW.items) as item
    LOOP
        -- Get total ordered quantity for this product
        total_ordered := get_total_ordered_quantity(product_record.product_id);
        
        RAISE NOTICE '📦 Product ID: %, Total Ordered: %', product_record.product_id, total_ordered;
        
        -- Update inventory items based on product recipe
        FOR recipe_item IN 
            SELECT 
                (r.value->>'inventoryId')::UUID as inv_id,
                (r.value->>'quantity')::INTEGER as qty_per_product
            FROM products p
            CROSS JOIN LATERAL jsonb_array_elements(p.recipe) as r
            WHERE p.id = product_record.product_id
            AND jsonb_array_length(p.recipe) > 0
        LOOP
            inventory_id := recipe_item.inv_id;
            inventory_quantity := recipe_item.qty_per_product;
            
            -- Calculate available inventory stock
            -- Available = Base Stock - (Total Ordered × Quantity per Product)
            available_stock := inventory_quantity * total_ordered;
            
            RAISE NOTICE '📦 Inventory ID: %, Reserved: % units', inventory_id, available_stock;
            
            -- Note: We don't actually update inventory stock here
            -- Instead, we track "reserved" stock separately
            -- The actual stock update happens when order is accepted (existing trigger)
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Alternative approach - Add "reserved" field to inventory
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS reserved INTEGER DEFAULT 0;

-- Step 4: Create function to update reserved inventory
CREATE OR REPLACE FUNCTION update_reserved_inventory()
RETURNS TRIGGER AS $$
DECLARE
    product_record RECORD;
    recipe_item RECORD;
    inventory_id UUID;
    total_reserved INTEGER;
BEGIN
    RAISE NOTICE '🔄 Updating reserved inventory...';
    
    -- Get all products from the order
    FOR product_record IN 
        SELECT DISTINCT (item.value->>'productId')::UUID as product_id
        FROM jsonb_array_elements(NEW.items) as item
    LOOP
        -- Get recipe for this product
        FOR recipe_item IN 
            SELECT 
                (r.value->>'inventoryId')::UUID as inv_id,
                (r.value->>'quantity')::INTEGER as qty_per_product
            FROM products p
            CROSS JOIN LATERAL jsonb_array_elements(p.recipe) as r
            WHERE p.id = product_record.product_id
            AND jsonb_array_length(p.recipe) > 0
        LOOP
            inventory_id := recipe_item.inv_id;
            
            -- Calculate total reserved for this inventory item across all pending orders
            SELECT COALESCE(SUM(
                (order_item.value->>'quantity')::INTEGER * 
                (recipe.value->>'quantity')::INTEGER
            ), 0)
            INTO total_reserved
            FROM orders o
            CROSS JOIN LATERAL jsonb_array_elements(o.items) as order_item
            CROSS JOIN LATERAL (
                SELECT p.recipe
                FROM products p
                WHERE p.id = (order_item.value->>'productId')::UUID
            ) as prod
            CROSS JOIN LATERAL jsonb_array_elements(prod.recipe) as recipe
            WHERE (recipe.value->>'inventoryId')::UUID = inventory_id
            AND o.status IN ('Pending', 'Accepted', 'Shipped');
            
            -- Update reserved quantity
            UPDATE inventory
            SET reserved = total_reserved
            WHERE id = inventory_id;
            
            RAISE NOTICE '✅ Inventory % reserved: %', inventory_id, total_reserved;
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger for order changes
DROP TRIGGER IF EXISTS update_reserved_inventory_trigger ON orders;

CREATE TRIGGER update_reserved_inventory_trigger
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_reserved_inventory();

-- Step 6: Create view for available inventory
CREATE OR REPLACE VIEW inventory_available AS
SELECT 
    i.id,
    i.name,
    i.stock as total_stock,
    i.reserved,
    (i.stock - i.reserved) as available_stock,
    i.msmeid,
    i.category,
    i.price,
    i.unitOfMeasure,
    i.minStockLevel
FROM inventory i;

-- Step 7: Initial calculation of reserved inventory
DO $$
DECLARE
    inv_record RECORD;
    total_reserved INTEGER;
BEGIN
    RAISE NOTICE '🔄 Calculating initial reserved inventory...';
    
    FOR inv_record IN SELECT id FROM inventory
    LOOP
        -- Calculate total reserved for this inventory item
        SELECT COALESCE(SUM(
            (order_item.value->>'quantity')::INTEGER * 
            (recipe.value->>'quantity')::INTEGER
        ), 0)
        INTO total_reserved
        FROM orders o
        CROSS JOIN LATERAL jsonb_array_elements(o.items) as order_item
        CROSS JOIN LATERAL (
            SELECT p.recipe
            FROM products p
            WHERE p.id = (order_item.value->>'productId')::UUID
        ) as prod
        CROSS JOIN LATERAL jsonb_array_elements(prod.recipe) as recipe
        WHERE (recipe.value->>'inventoryId')::UUID = inv_record.id
        AND o.status IN ('Pending', 'Accepted', 'Shipped');
        
        UPDATE inventory
        SET reserved = total_reserved
        WHERE id = inv_record.id;
        
        RAISE NOTICE '✅ Inventory % reserved: %', inv_record.id, total_reserved;
    END LOOP;
    
    RAISE NOTICE '✅ Initial reserved inventory calculated';
END $$;

-- Step 8: Verification
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AUTO-SYNC INVENTORY INSTALLED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What this does:';
    RAISE NOTICE '  1. Adds "reserved" field to inventory';
    RAISE NOTICE '  2. Tracks inventory reserved for orders';
    RAISE NOTICE '  3. Updates automatically when orders change';
    RAISE NOTICE '  4. Shows available stock in view';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '  Total Stock: 50 kg';
    RAISE NOTICE '  Reserved: 10 kg (for pending orders)';
    RAISE NOTICE '  Available: 40 kg';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Usage:';
    RAISE NOTICE '  -- View available inventory';
    RAISE NOTICE '  SELECT * FROM inventory_available;';
    RAISE NOTICE '';
    RAISE NOTICE '  -- Check reserved stock';
    RAISE NOTICE '  SELECT name, stock, reserved, ';
    RAISE NOTICE '         (stock - reserved) as available';
    RAISE NOTICE '  FROM inventory;';
    RAISE NOTICE '========================================';
END $$;
