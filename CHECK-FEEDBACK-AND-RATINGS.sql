-- =====================================================
-- CHECK FEEDBACK AND STAR RATINGS
-- =====================================================

-- =====================================================
-- STEP 1: Check if feedback table exists and has data
-- =====================================================

SELECT COUNT(*) as total_feedback FROM feedback;

-- View recent feedback
SELECT 
    id,
    username,
    rating,
    category,
    status,
    createdat
FROM feedback
ORDER BY createdat DESC
LIMIT 10;

-- =====================================================
-- STEP 2: Check if products table has rating columns
-- =====================================================

SELECT 
    column_name, 
    data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('averagerating', 'totalratings')
ORDER BY column_name;

-- =====================================================
-- STEP 3: Check products with ratings
-- =====================================================

SELECT 
    id,
    name,
    averagerating,
    totalratings,
    stock
FROM products
ORDER BY averagerating DESC NULLS LAST
LIMIT 10;

-- =====================================================
-- STEP 4: Check if rating trigger exists
-- =====================================================

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%product_rating%'
OR event_object_table = 'feedback';

-- =====================================================
-- STEP 5: Test rating calculation for a product
-- =====================================================

-- This shows if feedback is linked to products correctly
SELECT 
    p.id as product_id,
    p.name as product_name,
    COUNT(f.id) as feedback_count,
    AVG(f.rating) as calculated_avg_rating,
    p.averagerating as stored_avg_rating,
    p.totalratings as stored_total_ratings
FROM products p
LEFT JOIN orders o ON (o.items::jsonb @> jsonb_build_array(jsonb_build_object('productId', p.id::text)))
LEFT JOIN feedback f ON f.orderid = o.id
GROUP BY p.id, p.name, p.averagerating, p.totalratings
HAVING COUNT(f.id) > 0
ORDER BY feedback_count DESC
LIMIT 10;

-- =====================================================
-- RESULTS INTERPRETATION
-- =====================================================

/*
STEP 1: Check feedback count
- If 0: No feedback submitted yet
- If > 0: Feedback exists

STEP 2: Check rating columns
- Should return 2 rows: averagerating, totalratings
- If empty: Columns don't exist, run ADD-PRODUCT-RATINGS.sql

STEP 3: Check products with ratings
- If all NULL or 0: Ratings not calculated
- If has values: Ratings are working

STEP 4: Check trigger
- Should show: feedback_update_product_ratings
- If empty: Trigger doesn't exist, run ADD-PRODUCT-RATINGS.sql

STEP 5: Test calculation
- Shows if feedback is properly linked to products
- calculated_avg_rating should match stored_avg_rating

COMMON ISSUES:

Issue 1: Feedback count = 0
→ No feedback submitted
→ Submit feedback from buyer dashboard
→ Then check if ratings update

Issue 2: Rating columns don't exist
→ Run ADD-PRODUCT-RATINGS.sql
→ This adds averagerating and totalratings columns

Issue 3: Trigger doesn't exist
→ Run ADD-PRODUCT-RATINGS.sql
→ This creates trigger to auto-update ratings

Issue 4: Feedback exists but ratings are 0
→ Trigger not working
→ Run ADD-PRODUCT-RATINGS.sql
→ Or manually update: 
   UPDATE products SET averagerating = X, totalratings = Y WHERE id = '...';

Issue 5: Calculated vs Stored mismatch
→ Trigger not firing on new feedback
→ Check if realtime is enabled for feedback
→ Run ENABLE-REALTIME-UPDATES.sql
*/

-- =====================================================
-- QUICK FIX: Manually calculate ratings for all products
-- =====================================================

-- Uncomment and run this if ratings are not updating:
/*
DO $$
DECLARE
    product_record RECORD;
    rating_data RECORD;
BEGIN
    FOR product_record IN SELECT id FROM products LOOP
        -- Calculate ratings from feedback
        SELECT 
            COALESCE(ROUND(AVG(f.rating)::numeric, 2), 0.00)::DECIMAL(3,2) as avg_rating,
            COUNT(f.id)::INTEGER as total_count
        INTO rating_data
        FROM feedback f
        INNER JOIN orders o ON f.orderid = o.id
        INNER JOIN jsonb_array_elements(o.items) as item ON true
        WHERE (item->>'productId')::uuid = product_record.id
        AND f.rating IS NOT NULL;
        
        -- Update product
        UPDATE products
        SET 
            averagerating = rating_data.avg_rating,
            totalratings = rating_data.total_count
        WHERE id = product_record.id;
    END LOOP;
    
    RAISE NOTICE '✅ Calculated ratings for all products';
END $$;
*/
