-- =====================================================
-- STEP 1: CHECK IF FEEDBACK EXISTS
-- =====================================================

-- Check 1: Do we have any feedback?
SELECT 
    'CHECK 1: Feedback Exists?' as check_name,
    COUNT(*) as feedback_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Feedback exists'
        ELSE '❌ NO - No feedback yet'
    END as result
FROM feedback
WHERE rating IS NOT NULL;

-- Check 2: Show the feedback details
SELECT 
    'CHECK 2: Feedback Details' as check_name,
    f.username as buyer_name,
    f.rating as stars_given,
    f.productid,
    p.name as product_name
FROM feedback f
LEFT JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- Check 3: Is feedback linked to product?
SELECT 
    'CHECK 3: Feedback Linked to Product?' as check_name,
    COUNT(*) as linked_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ YES - Feedback has productid'
        ELSE '❌ NO - Feedback missing productid'
    END as result
FROM feedback
WHERE rating IS NOT NULL AND productid IS NOT NULL;

-- Check 4: What should the product rating be?
SELECT 
    'CHECK 4: Calculated Product Rating' as check_name,
    p.name as product_name,
    AVG(f.rating)::DECIMAL(3,2) as should_be_average,
    COUNT(f.rating) as should_be_count
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL
GROUP BY p.name;

-- Check 5: What is currently stored in product?
SELECT 
    'CHECK 5: Current Product Rating' as check_name,
    name as product_name,
    averagerating as current_average,
    totalratings as current_count,
    CASE 
        WHEN totalratings > 0 THEN '✅ Has rating'
        ELSE '❌ No rating (needs update)'
    END as status
FROM products;

-- DECISION
SELECT 
    'DECISION' as step,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM feedback WHERE rating IS NOT NULL AND productid IS NOT NULL
        ) AND NOT EXISTS (
            SELECT 1 FROM products WHERE totalratings > 0
        ) THEN '❌ FEEDBACK EXISTS BUT PRODUCT NOT UPDATED - Run STEP 2!'
        WHEN EXISTS (
            SELECT 1 FROM products WHERE totalratings > 0
        ) THEN '✅ PRODUCT HAS RATINGS - Just refresh your app!'
        ELSE '⚠️ NO FEEDBACK YET - Submit feedback first'
    END as what_to_do;

-- Final message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CHECK COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Look at the DECISION section above:';
    RAISE NOTICE '';
    RAISE NOTICE 'If it says "Run STEP 2":';
    RAISE NOTICE '  → Run STEP2-UPDATE-RATINGS.sql';
    RAISE NOTICE '';
    RAISE NOTICE 'If it says "Just refresh":';
    RAISE NOTICE '  → Press Ctrl+Shift+R in browser';
    RAISE NOTICE '  → Stars should appear!';
    RAISE NOTICE '========================================';
END $$;
