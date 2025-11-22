-- =====================================================
-- SIMPLE: LINK YOUR PRODUCTS TO INVENTORY
-- =====================================================
-- Follow these steps to link products to inventory
-- =====================================================

-- STEP 1: Get your inventory IDs
-- Copy the IDs from the results
SELECT 
    '📦 STEP 1: YOUR INVENTORY IDs' as step,
    id as inventory_id,
    name as inventory_name,
    category,
    stock
FROM inventory
ORDER BY name;

-- STEP 2: Get your product IDs
-- Copy the IDs from the results
SELECT 
    '🏭 STEP 2: YOUR PRODUCT IDs' as step,
    id as product_id,
    name as product_name,
    stock
FROM products
ORDER BY name;

-- STEP 3: Link products to inventory
-- =====================================================
-- INSTRUCTIONS:
-- 1. Copy an inventory_id from STEP 1
-- 2. Copy a product_id from STEP 2
-- 3. Uncomment the UPDATE statement below
-- 4. Replace 'YOUR-INVENTORY-ID' with actual inventory ID
-- 5. Replace 'YOUR-PRODUCT-ID' with actual product ID
-- 6. Adjust the quantity (how much inventory needed per product)
-- 7. Run the UPDATE statement
-- =====================================================

-- EXAMPLE: If your product "Fabric" uses "Yarn"
-- And 1 Fabric needs 2 kg of Yarn:

/*
UPDATE products
SET recipe = '[
    {"inventoryId": "YOUR-INVENTORY-ID-HERE", "quantity": 2}
]'::jsonb
WHERE id = 'YOUR-PRODUCT-ID-HERE';
*/

-- EXAMPLE: If your product uses MULTIPLE inventory items
-- Like Fabric needs Yarn AND Dye:

/*
UPDATE products
SET recipe = '[
    {"inventoryId": "YARN-INVENTORY-ID", "quantity": 2},
    {"inventoryId": "DYE-INVENTORY-ID", "quantity": 1}
]'::jsonb
WHERE id = 'FABRIC-PRODUCT-ID';
*/

-- STEP 4: Verify the link was created
SELECT 
    '✅ STEP 4: VERIFY LINKS' as step,
    p.name as product_name,
    p.recipe,
    CASE 
        WHEN p.recipe IS NULL THEN '❌ Not linked'
        WHEN jsonb_array_length(p.recipe) = 0 THEN '❌ Empty recipe'
        ELSE '✅ Linked to ' || jsonb_array_length(p.recipe)::text || ' inventory items'
    END as status
FROM products p
ORDER BY p.name;

-- STEP 5: Test with a sample order calculation
DO $$
DECLARE
    test_product RECORD;
    recipe_item RECORD;
    test_quantity INTEGER := 5; -- Example: ordering 5 units
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 STEP 5: TEST CALCULATION';
    RAISE NOTICE '========================================';
    
    -- Get first product with recipe
    SELECT id, name, recipe INTO test_product
    FROM products
    WHERE recipe IS NOT NULL 
    AND jsonb_array_length(recipe) > 0
    LIMIT 1;
    
    IF test_product.id IS NOT NULL THEN
        RAISE NOTICE 'Product: %', test_product.name;
        RAISE NOTICE 'Order quantity: % units', test_quantity;
        RAISE NOTICE '----------------------------------------';
        RAISE NOTICE 'Inventory that will be reserved:';
        
        FOR recipe_item IN SELECT * FROM jsonb_array_elements(test_product.recipe)
        LOOP
            DECLARE
                inv_name TEXT;
                inv_quantity INTEGER;
                total_needed INTEGER;
            BEGIN
                inv_quantity := (recipe_item.value->>'quantity')::INTEGER;
                total_needed := inv_quantity * test_quantity;
                
                -- Get inventory name
                SELECT name INTO inv_name
                FROM inventory
                WHERE id = (recipe_item.value->>'inventoryId')::UUID;
                
                RAISE NOTICE '  - %: % units (% × %)', 
                    COALESCE(inv_name, 'Unknown'), 
                    total_needed, 
                    test_quantity, 
                    inv_quantity;
            END;
        END LOOP;
        
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ When order is placed, these amounts';
        RAISE NOTICE '   will show in Reserved column!';
    ELSE
        RAISE NOTICE '⚠️ No products linked yet!';
        RAISE NOTICE 'Please complete STEP 3 first.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- INSTRUCTIONS SUMMARY
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 QUICK INSTRUCTIONS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Run STEP 1 - Get inventory IDs';
    RAISE NOTICE '2. Run STEP 2 - Get product IDs';
    RAISE NOTICE '3. Copy IDs and uncomment UPDATE statement';
    RAISE NOTICE '4. Replace placeholders with your IDs';
    RAISE NOTICE '5. Run the UPDATE statement';
    RAISE NOTICE '6. Run STEP 4 to verify';
    RAISE NOTICE '7. Run STEP 5 to test calculation';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'After linking:';
    RAISE NOTICE '  - Place an order as Buyer';
    RAISE NOTICE '  - Check Inventory menu';
    RAISE NOTICE '  - Reserved column will show amounts!';
    RAISE NOTICE '========================================';
END $$;
