-- =====================================================
-- STEP 2: UPDATE PRODUCT RATINGS FROM FEEDBACK
-- =====================================================
-- Only run this if STEP 1 said "Run STEP 2"

-- Show before state
SELECT 'BEFORE UPDATE' as status;
SELECT name, averagerating, totalratings FROM products;

-- DO THE UPDATE
UPDATE products p
SET 
    averagerating = COALESCE(
        (SELECT AVG(rating)::DECIMAL(3,2)
         FROM feedback f
         WHERE f.productid = p.id AND f.rating IS NOT NULL),
        0.00
    ),
    totalratings = COALESCE(
        (SELECT COUNT(*)::INTEGER
         FROM feedback f
         WHERE f.productid = p.id AND f.rating IS NOT NULL),
        0
    ),
    updatedat = NOW();

-- Show after state
SELECT 'AFTER UPDATE' as status;
SELECT 
    name, 
    averagerating as rating,
    totalratings as count,
    CASE 
        WHEN totalratings > 0 THEN '✅ SUCCESS!'
        ELSE '❌ Still no rating'
    END as result
FROM products;

-- Verify with feedback
SELECT 
    'VERIFICATION' as status,
    p.name as product,
    f.username as buyer,
    f.rating as feedback_stars,
    p.averagerating as product_rating,
    p.totalratings as rating_count
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- Create trigger for future auto-updates
DROP TRIGGER IF EXISTS trigger_update_product_rating ON feedback;
DROP FUNCTION IF EXISTS update_product_rating();

CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    IF NEW.productid IS NOT NULL AND NEW.rating IS NOT NULL THEN
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COALESCE(COUNT(rating), 0)::INTEGER
        INTO avg_rating, total_count
        FROM feedback
        WHERE productid = NEW.productid AND rating IS NOT NULL;
        
        UPDATE products
        SET 
            averagerating = avg_rating,
            totalratings = total_count,
            updatedat = NOW()
        WHERE id = NEW.productid;
        
        RAISE NOTICE '✅ Auto-updated product rating: % (%)', avg_rating, total_count;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Final check
SELECT 
    'FINAL STATUS' as status,
    COUNT(*) FILTER (WHERE totalratings > 0) as products_with_ratings,
    COUNT(*) as total_products
FROM products;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ UPDATE COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What happened:';
    RAISE NOTICE '  1. ✅ Product ratings updated from feedback';
    RAISE NOTICE '  2. ✅ Auto-update trigger created';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh browser (Ctrl+Shift+R)';
    RAISE NOTICE '  2. Go to Browse Products';
    RAISE NOTICE '  3. Stars should appear!';
    RAISE NOTICE '';
    RAISE NOTICE 'Future feedback will update automatically!';
    RAISE NOTICE '========================================';
END $$;
