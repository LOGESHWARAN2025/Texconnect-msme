-- =====================================================
-- QUICK GUIDE: LINK PRODUCTS TO INVENTORY
-- =====================================================
-- This shows how to link your products to inventory items
-- so the reserved column displays correctly
-- =====================================================

-- Step 1: View your inventory items (get IDs)
SELECT 
    '📦 YOUR INVENTORY ITEMS' as info,
    id,
    name,
    category,
    stock,
    COALESCE(reserved, 0) as reserved
FROM inventory
ORDER BY name;

-- Step 2: View your products (get IDs)
SELECT 
    '🏭 YOUR PRODUCTS' as info,
    id,
    name,
    stock,
    recipe
FROM products
ORDER BY name;

-- Step 3: Link products to inventory (EXAMPLES - MODIFY WITH YOUR IDs)
-- =====================================================

-- EXAMPLE 1: Cotton Fabric uses Cotton and Dye
-- Replace 'product-id-here' with actual product ID
-- Replace 'inventory-id-1' and 'inventory-id-2' with actual inventory IDs

/*
UPDATE products
SET recipe = '[
    {"inventoryId": "cotton-inventory-id", "quantity": 2},
    {"inventoryId": "dye-inventory-id", "quantity": 1}
]'::jsonb
WHERE id = 'cotton-fabric-product-id';
*/

-- EXAMPLE 2: Silk Fabric uses Silk and Dye
/*
UPDATE products
SET recipe = '[
    {"inventoryId": "silk-inventory-id", "quantity": 1.5},
    {"inventoryId": "dye-inventory-id", "quantity": 0.5}
]'::jsonb
WHERE id = 'silk-fabric-product-id';
*/

-- Step 4: Verify recipes were added
SELECT 
    '✅ PRODUCTS WITH RECIPES' as info,
    name,
    recipe,
    jsonb_array_length(recipe) as ingredient_count
FROM products
WHERE recipe IS NOT NULL 
AND jsonb_array_length(recipe) > 0;

-- Step 5: Test with a sample calculation
-- This shows what will be reserved when an order is placed
DO $$
DECLARE
    test_product_id UUID;
    test_order_quantity INTEGER := 5; -- Example: 5 units ordered
    product_recipe JSONB;
    recipe_item RECORD;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 RESERVATION CALCULATION TEST';
    RAISE NOTICE '========================================';
    
    -- Get first product with recipe
    SELECT id, recipe INTO test_product_id, product_recipe
    FROM products
    WHERE recipe IS NOT NULL 
    AND jsonb_array_length(recipe) > 0
    LIMIT 1;
    
    IF test_product_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with product: %', test_product_id;
        RAISE NOTICE 'Order quantity: %', test_order_quantity;
        RAISE NOTICE '----------------------------------------';
        
        FOR recipe_item IN SELECT * FROM jsonb_array_elements(product_recipe)
        LOOP
            RAISE NOTICE 'Inventory ID: %', recipe_item.value->>'inventoryId';
            RAISE NOTICE 'Quantity per product: %', recipe_item.value->>'quantity';
            RAISE NOTICE 'Total reserved: % units', 
                ((recipe_item.value->>'quantity')::INTEGER * test_order_quantity);
            RAISE NOTICE '----------------------------------------';
        END LOOP;
    ELSE
        RAISE NOTICE '⚠️ No products with recipes found!';
        RAISE NOTICE 'Please link products to inventory first.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Step 6: Instructions
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 HOW TO LINK YOUR PRODUCTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Copy inventory ID from Step 1 results';
    RAISE NOTICE '2. Copy product ID from Step 2 results';
    RAISE NOTICE '3. Uncomment and modify EXAMPLE above';
    RAISE NOTICE '4. Replace IDs with your actual IDs';
    RAISE NOTICE '5. Run the UPDATE statement';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Recipe Format:';
    RAISE NOTICE '  [';
    RAISE NOTICE '    {"inventoryId":"uuid","quantity":2},';
    RAISE NOTICE '    {"inventoryId":"uuid","quantity":1}';
    RAISE NOTICE '  ]';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'After linking:';
    RAISE NOTICE '  - Place an order';
    RAISE NOTICE '  - Check inventory reserved column';
    RAISE NOTICE '  - Available = Stock - Reserved';
    RAISE NOTICE '========================================';
END $$;
