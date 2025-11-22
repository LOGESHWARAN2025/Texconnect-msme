-- =====================================================
-- DIAGNOSE WHY RESERVED IS SHOWING 0
-- =====================================================

-- Step 1: Check if reserved column exists
SELECT 
    '✅ CHECK 1: Reserved Column' as check_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name = 'reserved';

-- Step 2: Check current inventory data
SELECT 
    '📦 CHECK 2: Inventory Data' as check_name,
    id,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;

-- Step 3: Check if products have recipes
SELECT 
    '🏭 CHECK 3: Product Recipes' as check_name,
    id,
    name,
    stock,
    CASE 
        WHEN recipe IS NULL THEN '❌ NULL'
        WHEN jsonb_array_length(recipe) = 0 THEN '❌ Empty []'
        ELSE '✅ Has recipe'
    END as recipe_status,
    recipe
FROM products
ORDER BY name;

-- Step 4: Check if trigger exists
SELECT 
    '🔧 CHECK 4: Trigger Exists' as check_name,
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'sync_inventory_reserved_trigger';

-- Step 5: Check pending orders
SELECT 
    '📋 CHECK 5: Pending Orders' as check_name,
    id,
    status,
    items,
    "createdAt"
FROM orders
WHERE status = 'Pending'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Step 6: Check all orders
SELECT 
    '📋 CHECK 6: All Recent Orders' as check_name,
    id,
    status,
    items,
    "createdAt"
FROM orders
ORDER BY "createdAt" DESC
LIMIT 5;

-- Step 7: Manual calculation of what reserved SHOULD be
DO $$
DECLARE
    order_record RECORD;
    item RECORD;
    product_id UUID;
    product_name TEXT;
    order_quantity INTEGER;
    total_reserved INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 MANUAL RESERVED CALCULATION';
    RAISE NOTICE '========================================';
    
    -- Loop through pending orders
    FOR order_record IN 
        SELECT id, items FROM orders WHERE status = 'Pending'
    LOOP
        RAISE NOTICE 'Order ID: %', order_record.id;
        
        -- Loop through items in order
        FOR item IN SELECT * FROM jsonb_array_elements(order_record.items)
        LOOP
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            -- Get product name
            SELECT name INTO product_name FROM products WHERE id = product_id;
            
            RAISE NOTICE '  Product: %, Quantity: %', product_name, order_quantity;
            total_reserved := total_reserved + order_quantity;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total that SHOULD be reserved: %', total_reserved;
    RAISE NOTICE '========================================';
END $$;

-- Step 8: Diagnostic summary
DO $$
DECLARE
    reserved_col_exists BOOLEAN;
    trigger_exists BOOLEAN;
    products_with_recipe INTEGER;
    pending_orders INTEGER;
    inventory_reserved INTEGER;
BEGIN
    -- Check reserved column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'reserved'
    ) INTO reserved_col_exists;
    
    -- Check trigger
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'sync_inventory_reserved_trigger'
    ) INTO trigger_exists;
    
    -- Count products with recipes
    SELECT COUNT(*) INTO products_with_recipe
    FROM products
    WHERE recipe IS NOT NULL AND jsonb_array_length(recipe) > 0;
    
    -- Count pending orders
    SELECT COUNT(*) INTO pending_orders
    FROM orders
    WHERE status = 'Pending';
    
    -- Sum reserved
    SELECT COALESCE(SUM(reserved), 0) INTO inventory_reserved
    FROM inventory;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Reserved column exists: %', reserved_col_exists;
    RAISE NOTICE 'Trigger installed: %', trigger_exists;
    RAISE NOTICE 'Products with recipes: %', products_with_recipe;
    RAISE NOTICE 'Pending orders: %', pending_orders;
    RAISE NOTICE 'Current reserved total: %', inventory_reserved;
    RAISE NOTICE '========================================';
    
    -- Diagnose the issue
    IF NOT reserved_col_exists THEN
        RAISE NOTICE '❌ ISSUE: Reserved column missing!';
        RAISE NOTICE 'Solution: Run SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
    ELSIF NOT trigger_exists THEN
        RAISE NOTICE '❌ ISSUE: Trigger not installed!';
        RAISE NOTICE 'Solution: Run SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
    ELSIF products_with_recipe = 0 THEN
        RAISE NOTICE '❌ ISSUE: Products not linked to inventory!';
        RAISE NOTICE 'Solution: Run SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
        RAISE NOTICE 'This will auto-link products with matching names';
    ELSIF pending_orders = 0 THEN
        RAISE NOTICE 'ℹ️ INFO: No pending orders';
        RAISE NOTICE 'Reserved = 0 is correct!';
        RAISE NOTICE 'Place an order to test the system';
    ELSIF inventory_reserved = 0 AND pending_orders > 0 THEN
        RAISE NOTICE '❌ ISSUE: Orders exist but reserved = 0!';
        RAISE NOTICE 'Possible causes:';
        RAISE NOTICE '  1. Orders placed before trigger was installed';
        RAISE NOTICE '  2. Products not linked to inventory';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '  1. Run SYNC-PRODUCT-ORDERS-TO-INVENTORY-RESERVED.sql';
        RAISE NOTICE '  2. Delete old orders';
        RAISE NOTICE '  3. Place new test order';
    ELSE
        RAISE NOTICE '✅ System working correctly!';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
