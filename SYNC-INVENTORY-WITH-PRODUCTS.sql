-- =====================================================
-- SYNC INVENTORY WITH PRODUCTS
-- =====================================================

-- Problem: When products are updated, inventory doesn't sync
-- Solution: Create trigger to auto-sync or deprecate inventory table

-- =====================================================
-- OPTION 1: Create Trigger to Auto-Sync Inventory
-- =====================================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS sync_inventory_on_product_update ON products;
DROP FUNCTION IF EXISTS sync_inventory_from_products();

-- Create function to sync inventory when products change
CREATE OR REPLACE FUNCTION sync_inventory_from_products()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if corresponding inventory item exists
    IF EXISTS (
        SELECT 1 FROM inventory 
        WHERE name = NEW.name 
        AND supplierid = NEW.msmeid
    ) THEN
        -- Update existing inventory item
        UPDATE inventory
        SET 
            quantity = NEW.stock,
            updatedat = NEW.updatedat
        WHERE name = NEW.name 
        AND supplierid = NEW.msmeid;
        
        RAISE NOTICE '✅ Synced inventory for product: %', NEW.name;
    ELSE
        -- Create new inventory item if it doesn't exist
        INSERT INTO inventory (
            supplierid,
            name,
            quantity,
            createdat,
            updatedat
        ) VALUES (
            NEW.msmeid,
            NEW.name,
            NEW.stock,
            NEW.createdat,
            NEW.updatedat
        );
        
        RAISE NOTICE '✅ Created inventory item for product: %', NEW.name;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on products table
CREATE TRIGGER sync_inventory_on_product_update
AFTER INSERT OR UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION sync_inventory_from_products();

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INVENTORY SYNC TRIGGER CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Now when products are updated:';
    RAISE NOTICE '  1. Inventory will auto-sync';
    RAISE NOTICE '  2. Stock changes reflect in both tables';
    RAISE NOTICE '  3. No manual sync needed';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- OPTION 2: One-Time Manual Sync (Run if needed)
-- =====================================================

-- Sync all existing products to inventory
DO $$
DECLARE
    product_record RECORD;
    synced_count INTEGER := 0;
    created_count INTEGER := 0;
BEGIN
    FOR product_record IN 
        SELECT id, msmeid as supplierid, name, stock, createdat, updatedat 
        FROM products
    LOOP
        -- Check if inventory item exists
        IF EXISTS (
            SELECT 1 FROM inventory 
            WHERE name = product_record.name 
            AND supplierid = product_record.supplierid
        ) THEN
            -- Update existing
            UPDATE inventory
            SET 
                quantity = product_record.stock,
                updatedat = product_record.updatedat
            WHERE name = product_record.name 
            AND supplierid = product_record.supplierid;
            
            synced_count := synced_count + 1;
        ELSE
            -- Create new
            INSERT INTO inventory (
                supplierid,
                name,
                quantity,
                createdat,
                updatedat
            ) VALUES (
                product_record.supplierid,
                product_record.name,
                product_record.stock,
                product_record.createdat,
                product_record.updatedat
            );
            
            created_count := created_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MANUAL SYNC COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Updated: % inventory items', synced_count;
    RAISE NOTICE 'Created: % new inventory items', created_count;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- VERIFY SYNC
-- =====================================================

-- Check if products and inventory are now in sync
SELECT 
    p.name as product_name,
    p.stock as product_stock,
    i.quantity as inventory_stock,
    CASE 
        WHEN p.stock = i.quantity THEN '✅ IN SYNC'
        WHEN i.quantity IS NULL THEN '❌ MISSING IN INVENTORY'
        ELSE '❌ OUT OF SYNC'
    END as sync_status,
    u.username as msme_owner
FROM products p
LEFT JOIN inventory i ON p.name = i.name AND p.msmeid = i.supplierid
LEFT JOIN users u ON p.msmeid = u.id
ORDER BY 
    CASE 
        WHEN p.stock = i.quantity THEN 1
        WHEN i.quantity IS NULL THEN 2
        ELSE 3
    END,
    p.name;

-- =====================================================
-- TEST THE SYNC
-- =====================================================

-- Test: Update a product's stock
DO $$
DECLARE
    test_product_id uuid;
    test_product_name text;
    old_product_stock integer;
    old_inventory_stock integer;
    new_product_stock integer;
    new_inventory_stock integer;
BEGIN
    -- Get a product
    SELECT id, name, stock 
    INTO test_product_id, test_product_name, old_product_stock
    FROM products
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '❌ No products found for testing';
        RETURN;
    END IF;
    
    -- Get current inventory stock
    SELECT quantity INTO old_inventory_stock
    FROM inventory
    WHERE name = test_product_name
    LIMIT 1;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 TESTING INVENTORY SYNC';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Product: %', test_product_name;
    RAISE NOTICE 'Old product stock: %', old_product_stock;
    RAISE NOTICE 'Old inventory stock: %', COALESCE(old_inventory_stock, 0);
    
    -- Update product stock
    UPDATE products
    SET stock = stock + 10
    WHERE id = test_product_id;
    
    -- Check new stocks
    SELECT stock INTO new_product_stock
    FROM products
    WHERE id = test_product_id;
    
    SELECT quantity INTO new_inventory_stock
    FROM inventory
    WHERE name = test_product_name
    LIMIT 1;
    
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'New product stock: %', new_product_stock;
    RAISE NOTICE 'New inventory stock: %', COALESCE(new_inventory_stock, 0);
    
    IF new_product_stock = new_inventory_stock THEN
        RAISE NOTICE '✅ SYNC WORKING! Stocks match.';
    ELSE
        RAISE NOTICE '❌ SYNC NOT WORKING! Stocks do not match.';
    END IF;
    
    -- Restore original stock
    UPDATE products
    SET stock = old_product_stock
    WHERE id = test_product_id;
    
    RAISE NOTICE '🔄 Test complete. Stock restored.';
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- OPTION 3: Deprecate Inventory Table (Alternative)
-- =====================================================

/*
If you want to completely remove the inventory table and use only products:

1. Update MSME Inventory View to read from products table
2. Drop inventory table
3. Remove inventory-related code

Uncomment below to deprecate inventory:

-- Backup inventory data (optional)
CREATE TABLE inventory_backup AS SELECT * FROM inventory;

-- Drop inventory table
DROP TABLE IF EXISTS inventory CASCADE;

RAISE NOTICE '========================================';
RAISE NOTICE '⚠️ INVENTORY TABLE DEPRECATED';
RAISE NOTICE '========================================';
RAISE NOTICE 'Inventory data backed up to: inventory_backup';
RAISE NOTICE 'Update MSMEInventoryView to use products table';
RAISE NOTICE '========================================';
*/

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 INVENTORY SYNC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '  1. ✅ Created sync trigger';
    RAISE NOTICE '  2. ✅ Synced all existing products';
    RAISE NOTICE '  3. ✅ Tested sync functionality';
    RAISE NOTICE '';
    RAISE NOTICE 'Now when you:';
    RAISE NOTICE '  - Update product stock';
    RAISE NOTICE '  - Place an order';
    RAISE NOTICE '  - Restock products';
    RAISE NOTICE '  → Inventory will auto-sync! ✅';
    RAISE NOTICE '========================================';
END $$;
