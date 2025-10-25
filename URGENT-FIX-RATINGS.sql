-- =====================================================
-- URGENT FIX: Product Ratings Not Showing
-- =====================================================
-- Run this script in Supabase SQL Editor NOW!

-- =====================================================
-- STEP 1: Add rating columns (if missing)
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS averagerating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE products ADD COLUMN IF NOT EXISTS totalratings INTEGER DEFAULT 0;

-- =====================================================
-- STEP 2: Add productId to feedback table (CRITICAL!)
-- =====================================================
-- This is the missing link!
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS productid UUID;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_feedback_productid ON feedback(productid);

-- =====================================================
-- STEP 3: Update existing feedback with productId
-- =====================================================
-- Link existing feedback to products via orders
UPDATE feedback f
SET productid = (
    SELECT (item->>'productId')::uuid
    FROM orders o, jsonb_array_elements(o.items) as item
    WHERE o.id = f.orderid
    LIMIT 1
)
WHERE f.orderid IS NOT NULL AND f.productid IS NULL;

-- =====================================================
-- STEP 4: Create SIMPLE trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    -- Only process if productid exists
    IF NEW.productid IS NOT NULL AND NEW.rating IS NOT NULL THEN
        -- Calculate average rating for this product
        SELECT 
            COALESCE(ROUND(AVG(rating)::numeric, 2), 0.00)::DECIMAL(3,2),
            COUNT(*)::INTEGER
        INTO avg_rating, total_count
        FROM feedback
        WHERE productid = NEW.productid
        AND rating IS NOT NULL;
        
        -- Update the product
        UPDATE products
        SET 
            averagerating = avg_rating,
            totalratings = total_count,
            updatedat = NOW()
        WHERE id = NEW.productid;
        
        RAISE NOTICE '✅ Product % updated: rating=%, count=%', NEW.productid, avg_rating, total_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: Create trigger
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_product_rating ON feedback;

CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- =====================================================
-- STEP 6: Calculate ratings for ALL products NOW
-- =====================================================
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

-- =====================================================
-- STEP 7: Verify results
-- =====================================================
SELECT 
    p.id,
    p.name,
    p.averagerating as "Average Rating",
    p.totalratings as "Total Ratings",
    p.stock
FROM products p
ORDER BY p.totalratings DESC, p.averagerating DESC
LIMIT 10;

-- Show feedback with products
SELECT 
    f.id,
    f.username,
    f.rating,
    f.productid,
    p.name as product_name
FROM feedback f
LEFT JOIN products p ON f.productid = p.id
WHERE f.rating IS NOT NULL
ORDER BY f.createdat DESC
LIMIT 10;

-- =====================================================
-- FINAL CHECK
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
    'Feedback with Product Link',
    COUNT(*)::text
FROM feedback WHERE productid IS NOT NULL;

-- =====================================================
-- SUCCESS!
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RATINGS FIX COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'What was fixed:';
    RAISE NOTICE '  1. Added productid column to feedback';
    RAISE NOTICE '  2. Linked existing feedback to products';
    RAISE NOTICE '  3. Created simple trigger';
    RAISE NOTICE '  4. Calculated all ratings';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Now when buyer submits feedback:';
    RAISE NOTICE '  → Rating automatically updates';
    RAISE NOTICE '  → Shows on product card';
    RAISE NOTICE '  → Displays as stars ★★★★☆';
    RAISE NOTICE '========================================';
END $$;
