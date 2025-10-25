-- =====================================================
-- FINAL FIX - This WILL work!
-- =====================================================

-- STEP 1: Check what we have
SELECT 'CURRENT STATE' as step;

SELECT 
    f.id as feedback_id,
    f.username,
    f.rating as feedback_rating,
    f.productid,
    p.id as product_id,
    p.name as product_name,
    p.averagerating as current_avg,
    p.totalratings as current_count
FROM feedback f
LEFT JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- STEP 2: Manual calculation to see what it SHOULD be
SELECT 
    'WHAT IT SHOULD BE' as step,
    f.productid,
    p.name,
    AVG(f.rating) as calculated_average,
    COUNT(f.rating) as calculated_count
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL
GROUP BY f.productid, p.name;

-- STEP 3: Force update each product individually
DO $$
DECLARE
    prod RECORD;
    avg_val DECIMAL(3,2);
    count_val INTEGER;
BEGIN
    -- Loop through each product
    FOR prod IN SELECT id, name FROM products LOOP
        
        -- Calculate for this specific product
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COALESCE(COUNT(rating), 0)::INTEGER
        INTO avg_val, count_val
        FROM feedback
        WHERE productid = prod.id
        AND rating IS NOT NULL;
        
        -- Update this product
        UPDATE products
        SET 
            averagerating = avg_val,
            totalratings = count_val,
            updatedat = NOW()
        WHERE id = prod.id;
        
        RAISE NOTICE 'Updated: % | Avg: % | Count: %', prod.name, avg_val, count_val;
        
    END LOOP;
END $$;

-- STEP 4: Verify the update worked
SELECT 'AFTER UPDATE' as step;

SELECT 
    p.id,
    p.name,
    p.averagerating as new_rating,
    p.totalratings as new_count,
    CASE 
        WHEN p.totalratings > 0 THEN '✅ HAS RATING'
        ELSE '❌ NO RATING'
    END as status
FROM products p;

-- STEP 5: Final check
SELECT 
    'FINAL VERIFICATION' as step,
    COUNT(*) FILTER (WHERE totalratings > 0) as products_with_ratings,
    COUNT(*) as total_products
FROM products;

-- STEP 6: Show how multiple ratings will work
SELECT 'HOW MULTIPLE RATINGS WORK' as step;

-- Example: If we had multiple feedbacks
SELECT 
    p.name as product_name,
    f.username,
    f.rating as individual_rating,
    AVG(f.rating) OVER (PARTITION BY p.id) as running_average,
    COUNT(f.rating) OVER (PARTITION BY p.id) as total_ratings
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL
ORDER BY p.name, f.createdat;

-- SUCCESS
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ UPDATE COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Check results above.';
    RAISE NOTICE 'Products with Ratings should be > 0 now';
    RAISE NOTICE '';
    RAISE NOTICE 'How multiple ratings work:';
    RAISE NOTICE '  User A rates 5 stars → Avg: 5.0 (1)';
    RAISE NOTICE '  User B rates 4 stars → Avg: 4.5 (2)';
    RAISE NOTICE '  User C rates 3 stars → Avg: 4.0 (3)';
    RAISE NOTICE '  Formula: (5+4+3)/3 = 4.0';
    RAISE NOTICE '========================================';
END $$;
