-- =====================================================
-- INSTANT FIX - Copy and Run This Entire Script
-- =====================================================

-- Update ALL products with their ratings from feedback
UPDATE products p
SET 
    averagerating = COALESCE(
        (SELECT ROUND(AVG(f.rating)::numeric, 2)::DECIMAL(3,2)
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

-- Show results
SELECT 
    p.id,
    p.name,
    p.averagerating as "Rating",
    p.totalratings as "Count",
    p.stock
FROM products p;

-- Verify
SELECT 
    'Products with Ratings' as status,
    COUNT(*)::text as count
FROM products WHERE totalratings > 0;

-- Show feedback linked to products
SELECT 
    f.username,
    f.rating,
    p.name as product_name,
    p.averagerating,
    p.totalratings
FROM feedback f
INNER JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL;

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '✅ DONE! Refresh your app now (Ctrl+R)';
END $$;
