-- =====================================================
-- CHECK PRODUCT-INVENTORY LINK STATUS
-- =====================================================
-- This verifies if products are linked to inventory
-- =====================================================

-- Step 1: Check if reserved column exists in inventory
SELECT 
    '✅ INVENTORY TABLE STRUCTURE' as info,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'inventory'
AND column_name IN ('stock', 'reserved')
ORDER BY column_name;

-- Step 2: Check if recipe column exists in products
SELECT 
    '✅ PRODUCTS TABLE STRUCTURE' as info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'recipe';

-- Step 3: Show current inventory with reserved amounts
SELECT 
    '📦 CURRENT INVENTORY STATUS' as info,
    id,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;

-- Step 4: Show products and their recipes
SELECT 
    '🏭 PRODUCTS AND RECIPES' as info,
    id,
    name,
    stock,
    CASE 
        WHEN recipe IS NULL THEN '❌ No recipe'
        WHEN jsonb_array_length(recipe) = 0 THEN '❌ Empty recipe'
        ELSE '✅ Has recipe (' || jsonb_array_length(recipe)::text || ' ingredients)'
    END as recipe_status,
    recipe
FROM products
ORDER BY name;

-- Step 5: Check pending orders
SELECT 
    '📋 PENDING ORDERS' as info,
    id,
    status,
    items,
    "createdAt"
FROM orders
WHERE status = 'Pending'
ORDER BY "createdAt" DESC
LIMIT 5;

-- Step 6: Diagnostic summary
DO $$
DECLARE
    inventory_count INTEGER;
    products_count INTEGER;
    products_with_recipe INTEGER;
    pending_orders INTEGER;
    reserved_total INTEGER;
BEGIN
    -- Count inventory items
    SELECT COUNT(*) INTO inventory_count FROM inventory;
    
    -- Count products
    SELECT COUNT(*) INTO products_count FROM products;
    
    -- Count products with recipes
    SELECT COUNT(*) INTO products_with_recipe 
    FROM products 
    WHERE recipe IS NOT NULL 
    AND jsonb_array_length(recipe) > 0;
    
    -- Count pending orders
    SELECT COUNT(*) INTO pending_orders 
    FROM orders 
    WHERE status = 'Pending';
    
    -- Sum of reserved inventory
    SELECT COALESCE(SUM(reserved), 0) INTO reserved_total FROM inventory;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 DIAGNOSTIC SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inventory items: %', inventory_count;
    RAISE NOTICE 'Products: %', products_count;
    RAISE NOTICE 'Products with recipes: %', products_with_recipe;
    RAISE NOTICE 'Pending orders: %', pending_orders;
    RAISE NOTICE 'Total reserved inventory: %', reserved_total;
    RAISE NOTICE '========================================';
    
    IF products_with_recipe = 0 THEN
        RAISE NOTICE '⚠️ ISSUE: No products linked to inventory!';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '1. Get inventory ID: SELECT id, name FROM inventory;';
        RAISE NOTICE '2. Get product ID: SELECT id, name FROM products;';
        RAISE NOTICE '3. Link them:';
        RAISE NOTICE '   UPDATE products';
        RAISE NOTICE '   SET recipe = ''[{"inventoryId":"inv-id","quantity":2}]''::jsonb';
        RAISE NOTICE '   WHERE id = ''product-id'';';
    ELSIF pending_orders = 0 THEN
        RAISE NOTICE 'ℹ️ No pending orders - Reserved is 0 (correct)';
        RAISE NOTICE '';
        RAISE NOTICE 'To test:';
        RAISE NOTICE '1. Login as Buyer';
        RAISE NOTICE '2. Place an order';
        RAISE NOTICE '3. Check inventory reserved column';
    ELSIF reserved_total = 0 THEN
        RAISE NOTICE '⚠️ ISSUE: Pending orders exist but reserved = 0!';
        RAISE NOTICE '';
        RAISE NOTICE 'Possible causes:';
        RAISE NOTICE '1. Products not linked to inventory (no recipe)';
        RAISE NOTICE '2. Trigger not installed';
        RAISE NOTICE '3. Orders placed before trigger was installed';
        RAISE NOTICE '';
        RAISE NOTICE 'Solution:';
        RAISE NOTICE '1. Run: AUTO-RESERVE-INVENTORY-FROM-PRODUCTS.sql';
        RAISE NOTICE '2. Link products to inventory';
        RAISE NOTICE '3. Delete old orders and place new ones';
    ELSE
        RAISE NOTICE '✅ System working correctly!';
        RAISE NOTICE 'Reserved inventory: % units', reserved_total;
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
