-- =====================================================
-- COMPLETE RATING SOLUTION
-- =====================================================
-- This will make ratings work 100%

-- STEP 1: Ensure columns exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS averagerating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS totalratings INTEGER DEFAULT 0;
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS productid UUID;

-- STEP 2: Link existing feedback to products via orders
UPDATE feedback f
SET productid = (
    SELECT (item->>'productId')::uuid
    FROM orders o,
    jsonb_array_elements(o.items) as item
    WHERE o.id = f.orderid
    LIMIT 1
)
WHERE f.productid IS NULL
AND f.orderid IS NOT NULL;

-- STEP 3: Calculate and store ratings for ALL products
UPDATE products p
SET 
    averagerating = COALESCE(
        (SELECT ROUND(AVG(f.rating)::numeric, 2)::DECIMAL(3,2)
         FROM feedback f
         WHERE f.productid = p.id 
         AND f.rating IS NOT NULL),
        0.00
    ),
    totalratings = COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM feedback f
         WHERE f.productid = p.id 
         AND f.rating IS NOT NULL),
        0
    );

-- STEP 4: Show results
SELECT 
    '✅ PRODUCTS WITH RATINGS' as status,
    p.id::text as product_id,
    p.name as product_name,
    p.averagerating as rating,
    p.totalratings as count,
    CASE 
        WHEN p.totalratings > 0 THEN '⭐ HAS RATING'
        ELSE '❌ NO RATING'
    END as display_status
FROM products p;

-- STEP 5: Show feedback linked to products
SELECT 
    '📝 FEEDBACK DATA' as status,
    f.username as buyer,
    f.rating as stars,
    p.name as product,
    f.productid::text as linked_productid
FROM feedback f
LEFT JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- STEP 6: Create trigger for automatic updates
DROP TRIGGER IF EXISTS auto_update_product_rating ON feedback;
DROP FUNCTION IF EXISTS auto_update_product_rating();

CREATE OR REPLACE FUNCTION auto_update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    rating_count INTEGER;
BEGIN
    -- If productid is NULL, get it from order
    IF NEW.productid IS NULL AND NEW.orderid IS NOT NULL THEN
        NEW.productid := (
            SELECT (item->>'productId')::uuid
            FROM orders o,
            jsonb_array_elements(o.items) as item
            WHERE o.id = NEW.orderid
            LIMIT 1
        );
    END IF;
    
    -- Update product rating if we have productid and rating
    IF NEW.productid IS NOT NULL AND NEW.rating IS NOT NULL THEN
        -- Calculate new average
        SELECT 
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::DECIMAL(3,2),
            COALESCE(COUNT(*), 0)::INTEGER
        INTO avg_rating, rating_count
        FROM feedback
        WHERE productid = NEW.productid
        AND rating IS NOT NULL;
        
        -- Update product
        UPDATE products
        SET 
            averagerating = avg_rating,
            totalratings = rating_count,
            updatedat = NOW()
        WHERE id = NEW.productid;
        
        RAISE NOTICE '✅ Product rating updated: % stars (%)', avg_rating, rating_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_product_rating
    BEFORE INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_product_rating();

-- STEP 7: Final verification
SELECT 
    '📊 FINAL SUMMARY' as status,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM products WHERE totalratings > 0) as products_with_ratings,
    (SELECT COUNT(*) FROM feedback WHERE rating IS NOT NULL) as total_feedback,
    (SELECT COUNT(*) FROM feedback WHERE productid IS NOT NULL) as feedback_linked;

-- STEP 8: Show what will display in Browse Products
SELECT 
    '🌟 WHAT BUYERS WILL SEE' as status,
    p.name as product_name,
    CASE 
        WHEN p.totalratings = 0 THEN 'No ratings yet'
        WHEN p.averagerating >= 4.5 THEN '★★★★★ ' || p.averagerating || ' (' || p.totalratings || ')'
        WHEN p.averagerating >= 3.5 THEN '★★★★☆ ' || p.averagerating || ' (' || p.totalratings || ')'
        WHEN p.averagerating >= 2.5 THEN '★★★☆☆ ' || p.averagerating || ' (' || p.totalratings || ')'
        WHEN p.averagerating >= 1.5 THEN '★★☆☆☆ ' || p.averagerating || ' (' || p.totalratings || ')'
        ELSE '★☆☆☆☆ ' || p.averagerating || ' (' || p.totalratings || ')'
    END as display
FROM products p;

-- SUCCESS MESSAGE
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMPLETE RATING SOLUTION APPLIED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What was done:';
    RAISE NOTICE '  1. ✅ Added rating columns to products';
    RAISE NOTICE '  2. ✅ Linked feedback to products';
    RAISE NOTICE '  3. ✅ Calculated all ratings';
    RAISE NOTICE '  4. ✅ Created auto-update trigger';
    RAISE NOTICE '';
    RAISE NOTICE 'Now:';
    RAISE NOTICE '  - Each product stores its rating';
    RAISE NOTICE '  - Ratings display in Browse Products';
    RAISE NOTICE '  - New feedback updates automatically';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Refresh browser (Ctrl+Shift+R)';
    RAISE NOTICE '========================================';
END $$;
