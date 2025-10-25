-- =====================================================
-- CHECK CURRENT FEEDBACK AND RATINGS
-- =====================================================

-- STEP 1: Show all feedback with ratings
SELECT 
    '📝 ALL FEEDBACK' as section,
    f.id as feedback_id,
    f.username as buyer_name,
    f.rating as stars_given,
    f.comment,
    f.productid,
    f.createdat as submitted_at
FROM feedback f
WHERE f.rating IS NOT NULL
ORDER BY f.createdat DESC;

-- STEP 2: Show which products have feedback
SELECT 
    '🔗 FEEDBACK LINKED TO PRODUCTS' as section,
    p.name as product_name,
    f.username as buyer_name,
    f.rating as stars_given,
    f.createdat as when_submitted
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL
ORDER BY p.name, f.createdat;

-- STEP 3: Count feedback per product
SELECT 
    '📊 FEEDBACK COUNT PER PRODUCT' as section,
    p.name as product_name,
    COUNT(f.rating) as total_feedback_count,
    AVG(f.rating)::DECIMAL(3,2) as calculated_average,
    MIN(f.rating) as lowest_rating,
    MAX(f.rating) as highest_rating
FROM products p
LEFT JOIN feedback f ON f.productid = p.id AND f.rating IS NOT NULL
GROUP BY p.id, p.name
ORDER BY p.name;

-- STEP 4: Show current product ratings
SELECT 
    '⭐ CURRENT PRODUCT RATINGS' as section,
    p.name as product_name,
    p.averagerating as stored_average,
    p.totalratings as stored_count,
    CASE 
        WHEN p.totalratings > 0 THEN '✅ Has ratings'
        ELSE '❌ No ratings'
    END as status
FROM products p
ORDER BY p.name;

-- STEP 5: Compare calculated vs stored
SELECT 
    '🔍 CALCULATED vs STORED' as section,
    p.name as product_name,
    COALESCE(AVG(f.rating)::DECIMAL(3,2), 0.00) as calculated_average,
    p.averagerating as stored_average,
    COALESCE(COUNT(f.rating), 0) as calculated_count,
    p.totalratings as stored_count,
    CASE 
        WHEN COALESCE(AVG(f.rating)::DECIMAL(3,2), 0.00) = p.averagerating 
        AND COALESCE(COUNT(f.rating), 0) = p.totalratings 
        THEN '✅ MATCH'
        ELSE '❌ MISMATCH - NEEDS UPDATE'
    END as match_status
FROM products p
LEFT JOIN feedback f ON f.productid = p.id AND f.rating IS NOT NULL
GROUP BY p.id, p.name, p.averagerating, p.totalratings
ORDER BY p.name;

-- STEP 6: Summary
SELECT 
    '📈 SUMMARY' as section,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM products WHERE totalratings > 0) as products_with_ratings,
    (SELECT COUNT(*) FROM feedback WHERE rating IS NOT NULL) as total_feedback_submitted,
    (SELECT COUNT(DISTINCT productid) FROM feedback WHERE rating IS NOT NULL) as products_that_have_feedback;

-- STEP 7: Show what stars mean
SELECT 
    '⭐ STAR RATING GUIDE' as section,
    '5 stars' as rating,
    '⭐⭐⭐⭐⭐' as display,
    'Excellent' as meaning
UNION ALL
SELECT '', '4 stars', '⭐⭐⭐⭐☆', 'Good'
UNION ALL
SELECT '', '3 stars', '⭐⭐⭐☆☆', 'Average'
UNION ALL
SELECT '', '2 stars', '⭐⭐☆☆☆', 'Poor'
UNION ALL
SELECT '', '1 star', '⭐☆☆☆☆', 'Very Poor';

-- STEP 8: Example of how multiple ratings work
SELECT 
    '💡 EXAMPLE: Multiple Buyers Rating Same Product' as section;

-- Show example calculation
SELECT 
    'Example Scenario' as step,
    'Buyer 1 gives 5 stars' as action,
    '5.0' as average,
    '1' as count
UNION ALL
SELECT 
    '',
    'Buyer 2 gives 4 stars',
    '(5+4)/2 = 4.5',
    '2'
UNION ALL
SELECT 
    '',
    'Buyer 3 gives 5 stars',
    '(5+4+5)/3 = 4.7',
    '3'
UNION ALL
SELECT 
    '',
    'Buyer 4 gives 3 stars',
    '(5+4+5+3)/4 = 4.3',
    '4';

-- Final message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DIAGNOSTIC COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Check the results above to see:';
    RAISE NOTICE '  1. How many feedback submitted';
    RAISE NOTICE '  2. What stars buyers gave';
    RAISE NOTICE '  3. Which products have feedback';
    RAISE NOTICE '  4. If ratings match (calculated vs stored)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'If MISMATCH shown, run FINAL-FIX-NOW.sql';
    RAISE NOTICE '========================================';
END $$;
