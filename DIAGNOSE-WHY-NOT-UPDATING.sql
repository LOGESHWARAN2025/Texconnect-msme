-- =====================================================
-- DIAGNOSE: Why ratings not updating
-- =====================================================

-- 1. Show raw feedback data
SELECT 
    '1. RAW FEEDBACK DATA' as step,
    id,
    username,
    rating,
    productid,
    orderid
FROM feedback;

-- 2. Show raw products data
SELECT 
    '2. RAW PRODUCTS DATA' as step,
    id,
    name,
    averagerating,
    totalratings
FROM products;

-- 3. Check data types
SELECT 
    '3. FEEDBACK COLUMN TYPES' as step,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'feedback'
AND column_name IN ('productid', 'rating');

SELECT 
    '4. PRODUCTS COLUMN TYPES' as step,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('id', 'averagerating', 'totalratings');

-- 5. Test if productid matches
SELECT 
    '5. DO PRODUCTIDS MATCH?' as step,
    f.productid as feedback_productid,
    p.id as product_id,
    CASE 
        WHEN f.productid = p.id THEN '✅ MATCH'
        ELSE '❌ NO MATCH'
    END as match_status
FROM feedback f
CROSS JOIN products p
WHERE f.rating IS NOT NULL;

-- 6. Manual calculation
SELECT 
    '6. MANUAL CALCULATION' as step,
    f.productid,
    AVG(f.rating) as calculated_avg,
    COUNT(f.rating) as calculated_count
FROM feedback f
WHERE f.rating IS NOT NULL
GROUP BY f.productid;

-- 7. Try direct update on specific product
DO $$
DECLARE
    prod_id UUID;
    avg_val DECIMAL(3,2);
    count_val INTEGER;
BEGIN
    -- Get the product ID
    SELECT id INTO prod_id FROM products LIMIT 1;
    
    -- Calculate from feedback
    SELECT 
        COALESCE(AVG(rating), 0)::DECIMAL(3,2),
        COALESCE(COUNT(rating), 0)::INTEGER
    INTO avg_val, count_val
    FROM feedback
    WHERE productid = prod_id
    AND rating IS NOT NULL;
    
    RAISE NOTICE 'Product ID: %', prod_id;
    RAISE NOTICE 'Calculated Average: %', avg_val;
    RAISE NOTICE 'Calculated Count: %', count_val;
    
    -- Try to update
    UPDATE products
    SET 
        averagerating = avg_val,
        totalratings = count_val
    WHERE id = prod_id;
    
    RAISE NOTICE 'Update executed';
    
    -- Check if it worked
    SELECT averagerating, totalratings INTO avg_val, count_val
    FROM products WHERE id = prod_id;
    
    RAISE NOTICE 'After update - Average: %, Count: %', avg_val, count_val;
END $$;

-- 8. Show result
SELECT 
    '8. AFTER DIRECT UPDATE' as step,
    name,
    averagerating,
    totalratings
FROM products;

-- 9. Check if there are any constraints or triggers blocking
SELECT 
    '9. CHECK CONSTRAINTS' as step,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'products';

-- 10. Final verification
SELECT 
    '10. FINAL CHECK' as step,
    (SELECT COUNT(*) FROM feedback WHERE rating IS NOT NULL) as feedback_count,
    (SELECT COUNT(*) FROM feedback WHERE productid IS NOT NULL) as feedback_with_productid,
    (SELECT COUNT(*) FROM products WHERE totalratings > 0) as products_with_ratings;
