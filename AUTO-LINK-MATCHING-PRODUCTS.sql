-- =====================================================
-- AUTO-LINK PRODUCTS TO MATCHING INVENTORY
-- =====================================================
-- If product name matches inventory name, link them automatically
-- Example: Product "Yarn" → Inventory "Yarn"
-- =====================================================

-- Step 1: Show products and matching inventory
SELECT 
    '🔍 MATCHING PRODUCTS AND INVENTORY' as info,
    p.id as product_id,
    p.name as product_name,
    i.id as inventory_id,
    i.name as inventory_name,
    CASE 
        WHEN p.recipe IS NULL OR jsonb_array_length(p.recipe) = 0 
        THEN '❌ Not linked'
        ELSE '✅ Already linked'
    END as current_status
FROM products p
INNER JOIN inventory i ON LOWER(p.name) = LOWER(i.name)
ORDER BY p.name;

-- Step 2: Auto-link products to matching inventory
-- This will link products where name matches inventory name
-- 1 product unit = 1 inventory unit

DO $$
DECLARE
    product_record RECORD;
    inventory_id UUID;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔄 AUTO-LINKING PRODUCTS TO INVENTORY';
    RAISE NOTICE '========================================';
    
    FOR product_record IN 
        SELECT p.id, p.name, p.recipe
        FROM products p
        WHERE p.recipe IS NULL OR jsonb_array_length(p.recipe) = 0
    LOOP
        -- Find matching inventory by name
        SELECT i.id INTO inventory_id
        FROM inventory i
        WHERE LOWER(i.name) = LOWER(product_record.name)
        LIMIT 1;
        
        IF inventory_id IS NOT NULL THEN
            -- Link product to inventory (1:1 ratio)
            UPDATE products
            SET recipe = jsonb_build_array(
                jsonb_build_object(
                    'inventoryId', inventory_id,
                    'quantity', 1
                )
            )
            WHERE id = product_record.id;
            
            updated_count := updated_count + 1;
            RAISE NOTICE '✅ Linked product "%" to inventory', product_record.name;
        ELSE
            RAISE NOTICE '⚠️ No matching inventory for product "%"', product_record.name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Updated % products', updated_count;
    RAISE NOTICE '========================================';
END $$;

-- Step 3: Verify the links
SELECT 
    '✅ VERIFICATION' as info,
    p.name as product_name,
    p.recipe,
    CASE 
        WHEN p.recipe IS NULL OR jsonb_array_length(p.recipe) = 0 
        THEN '❌ Not linked'
        ELSE '✅ Linked to ' || jsonb_array_length(p.recipe)::text || ' inventory items'
    END as status,
    (
        SELECT i.name 
        FROM inventory i 
        WHERE i.id = (p.recipe->0->>'inventoryId')::UUID
    ) as linked_inventory
FROM products p
ORDER BY p.name;

-- Step 4: Show reserved amounts (should update after placing orders)
SELECT 
    '📊 INVENTORY RESERVATION STATUS' as info,
    name,
    stock,
    COALESCE(reserved, 0) as reserved,
    (stock - COALESCE(reserved, 0)) as available
FROM inventory
ORDER BY name;

-- Final instructions
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AUTO-LINK COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What happened:';
    RAISE NOTICE '  - Products matched to inventory by name';
    RAISE NOTICE '  - Linked with 1:1 ratio';
    RAISE NOTICE '  - Recipe created automatically';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Verify links in VERIFICATION section';
    RAISE NOTICE '  2. Place a test order as Buyer';
    RAISE NOTICE '  3. Check inventory Reserved column';
    RAISE NOTICE '  4. Reserved should show order quantity';
    RAISE NOTICE '';
    RAISE NOTICE 'Example:';
    RAISE NOTICE '  Order 5 Yarn → Reserved = 5';
    RAISE NOTICE '  Available = Stock - 5';
    RAISE NOTICE '========================================';
END $$;
