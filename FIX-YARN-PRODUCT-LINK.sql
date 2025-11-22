-- =====================================================
-- FIX YARN PRODUCT LINK
-- =====================================================
-- Your product "Yarn" has empty recipe []
-- This script helps you link it to inventory
-- =====================================================

-- Step 1: Check your inventory items
SELECT 
    '📦 YOUR INVENTORY ITEMS' as info,
    id,
    name,
    category,
    stock
FROM inventory
ORDER BY name;

-- Step 2: Check your products
SELECT 
    '🏭 YOUR PRODUCTS' as info,
    id,
    name,
    stock,
    recipe
FROM products
ORDER BY name;

-- Step 3: DECISION - Choose one option below
-- =====================================================

-- OPTION A: Yarn is a FINISHED PRODUCT made from inventory
-- Example: Yarn is made from Cotton fiber
-- Uncomment and modify this:

/*
-- Get the Yarn product ID and Cotton inventory ID from above
UPDATE products
SET recipe = '[
    {"inventoryId": "YOUR-COTTON-INVENTORY-ID-HERE", "quantity": 1}
]'::jsonb
WHERE name = 'Yarn';
*/

-- OPTION B: Yarn is BOTH inventory AND product (same item)
-- Link the product to its own inventory
-- This is useful if you buy Yarn (inventory) and sell Yarn (product)

/*
-- First, get the IDs
SELECT 
    'Get these IDs:' as info,
    (SELECT id FROM inventory WHERE name = 'Yarn') as inventory_id,
    (SELECT id FROM products WHERE name = 'Yarn') as product_id;

-- Then link them (1 product Yarn = 1 inventory Yarn)
UPDATE products
SET recipe = '[
    {"inventoryId": "PASTE-INVENTORY-ID-HERE", "quantity": 1}
]'::jsonb
WHERE name = 'Yarn';
*/

-- OPTION C: Yarn should NOT be a product (only inventory)
-- Delete it from products table

/*
DELETE FROM products WHERE name = 'Yarn';
*/

-- Step 4: Verify the fix
SELECT 
    '✅ AFTER FIX' as info,
    name,
    recipe,
    CASE 
        WHEN recipe IS NULL THEN '❌ No recipe'
        WHEN jsonb_array_length(recipe) = 0 THEN '❌ Empty recipe'
        ELSE '✅ Linked to ' || jsonb_array_length(recipe)::text || ' inventory items'
    END as status
FROM products
WHERE name = 'Yarn';

-- Instructions
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 HOW TO FIX YARN PRODUCT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION A: Yarn is made from other materials';
    RAISE NOTICE '  - Get inventory ID of raw material';
    RAISE NOTICE '  - Uncomment OPTION A';
    RAISE NOTICE '  - Replace YOUR-COTTON-INVENTORY-ID-HERE';
    RAISE NOTICE '  - Run the UPDATE statement';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION B: Yarn is both inventory and product';
    RAISE NOTICE '  - Get Yarn inventory ID';
    RAISE NOTICE '  - Uncomment OPTION B';
    RAISE NOTICE '  - Replace PASTE-INVENTORY-ID-HERE';
    RAISE NOTICE '  - Run the UPDATE statement';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION C: Yarn should only be inventory';
    RAISE NOTICE '  - Uncomment OPTION C';
    RAISE NOTICE '  - Run the DELETE statement';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Most common: OPTION B';
    RAISE NOTICE '(Buy Yarn as inventory, sell Yarn as product)';
    RAISE NOTICE '========================================';
END $$;
