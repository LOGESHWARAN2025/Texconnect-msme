-- =====================================================
-- FORCE UPDATE PRODUCT RATINGS - RUN THIS NOW!
-- =====================================================

-- =====================================================
-- STEP 1: Check current state
-- =====================================================
SELECT 'BEFORE UPDATE' as status;

SELECT 
    p.id,
    p.name,
    p.averagerating as current_rating,
    p.totalratings as current_count
FROM products p;

SELECT 
    f.id,
    f.rating,
    f.productid,
    p.name as product_name
FROM feedback f
LEFT JOIN products p ON f.productid = p.id;

-- =====================================================
-- STEP 2: FORCE UPDATE ALL PRODUCTS NOW
-- =====================================================
DO $$
DECLARE
    product_rec RECORD;
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    FOR product_rec IN SELECT id, name FROM products LOOP
        -- Calculate rating for this specific product
        SELECT 
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00)::DECIMAL(3,2),
            COUNT(*)::INTEGER
        INTO avg_rating, total_count
        FROM feedback
        WHERE productid = product_rec.id
        AND rating IS NOT NULL;
        
        -- Force update
        UPDATE products
        SET 
            averagerating = avg_rating,
            totalratings = total_count,
            updatedat = NOW()
        WHERE id = product_rec.id;
        
        RAISE NOTICE 'Product: % | Rating: % | Count: %', 
            product_rec.name, avg_rating, total_count;
    END LOOP;
END $$;

-- =====================================================
-- STEP 3: Verify update worked
-- =====================================================
SELECT 'AFTER UPDATE' as status;

SELECT 
    p.id,
    p.name,
    p.averagerating as new_rating,
    p.totalratings as new_count,
    p.stock,
    p.price
FROM products p;

-- =====================================================
-- STEP 4: Check feedback-product link
-- =====================================================
SELECT 
    f.id as feedback_id,
    f.username,
    f.rating as feedback_rating,
    f.productid,
    p.name as product_name,
    p.averagerating as product_avg_rating,
    p.totalratings as product_total_ratings
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- =====================================================
-- STEP 5: Final verification
-- =====================================================
SELECT 
    'Total Products' as metric,
    COUNT(*)::text as count
FROM products
UNION ALL
SELECT 
    'Products with Ratings',
    COUNT(*)::text
FROM products WHERE totalratings > 0
UNION ALL
SELECT 
    'Total Feedback',
    COUNT(*)::text
FROM feedback
UNION ALL
SELECT 
    'Feedback with Ratings',
    COUNT(*)::text
FROM feedback WHERE rating IS NOT NULL
UNION ALL
SELECT 
    'Feedback with Product Link',
    COUNT(*)::text
FROM feedback WHERE productid IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RATINGS FORCE UPDATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Check the results above.';
    RAISE NOTICE 'Products with Ratings should now be > 0';
    RAISE NOTICE '========================================';
END $$;
