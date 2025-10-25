-- =====================================================
-- FORCE UPDATE - This WILL work!
-- =====================================================

-- Step 1: Show what we have
SELECT 'STEP 1: Current State' as info;

SELECT 'Feedback:' as table_name, id, username, rating, productid FROM feedback WHERE rating IS NOT NULL;
SELECT 'Products:' as table_name, id, name, averagerating, totalratings FROM products;

-- Step 2: Get the IDs
DO $$
DECLARE
    feedback_productid UUID;
    product_id UUID;
    rating_value INTEGER;
BEGIN
    -- Get productid from feedback
    SELECT productid, rating INTO feedback_productid, rating_value
    FROM feedback 
    WHERE rating IS NOT NULL 
    LIMIT 1;
    
    RAISE NOTICE 'Feedback productid: %', feedback_productid;
    RAISE NOTICE 'Feedback rating: %', rating_value;
    
    -- Get product id
    SELECT id INTO product_id FROM products LIMIT 1;
    RAISE NOTICE 'Product id: %', product_id;
    
    -- Check if they match
    IF feedback_productid = product_id THEN
        RAISE NOTICE '✅ IDs MATCH!';
    ELSE
        RAISE NOTICE '❌ IDs DO NOT MATCH!';
        RAISE NOTICE 'This is the problem - feedback.productid does not match products.id';
    END IF;
END $$;

-- Step 3: Force update using the actual productid from feedback
UPDATE products
SET 
    averagerating = (
        SELECT AVG(rating)::DECIMAL(3,2)
        FROM feedback
        WHERE feedback.productid = products.id
        AND rating IS NOT NULL
    ),
    totalratings = (
        SELECT COUNT(*)::INTEGER
        FROM feedback
        WHERE feedback.productid = products.id
        AND rating IS NOT NULL
    )
WHERE id IN (
    SELECT DISTINCT productid 
    FROM feedback 
    WHERE productid IS NOT NULL 
    AND rating IS NOT NULL
);

-- Step 4: Show result
SELECT 'STEP 4: After Update' as info;
SELECT name, averagerating, totalratings FROM products;

-- Step 5: If still 0, try setting manually
DO $$
DECLARE
    prod_id UUID;
    avg_rating DECIMAL(3,2);
    rating_count INTEGER;
BEGIN
    -- Get first product
    SELECT id INTO prod_id FROM products LIMIT 1;
    
    -- Calculate manually
    SELECT 
        COALESCE(AVG(rating::NUMERIC), 0)::DECIMAL(3,2),
        COALESCE(COUNT(rating), 0)::INTEGER
    INTO avg_rating, rating_count
    FROM feedback
    WHERE productid = prod_id;
    
    RAISE NOTICE 'Calculated: avg=%, count=%', avg_rating, rating_count;
    
    -- If we have ratings but product still shows 0, force set it
    IF rating_count > 0 THEN
        EXECUTE format(
            'UPDATE products SET averagerating = %s, totalratings = %s WHERE id = %L',
            avg_rating, rating_count, prod_id
        );
        RAISE NOTICE '✅ Forced update executed';
    END IF;
END $$;

-- Step 6: Final check
SELECT 'STEP 6: Final Result' as info;
SELECT 
    p.name,
    p.averagerating,
    p.totalratings,
    (SELECT COUNT(*) FROM feedback WHERE productid = p.id AND rating IS NOT NULL) as actual_feedback_count
FROM products p;

-- Step 7: Verification
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM products WHERE totalratings > 0) 
        THEN '✅ SUCCESS! Products have ratings now!'
        ELSE '❌ STILL FAILED - Need to check data manually'
    END as final_status;
