-- =====================================================
-- ADD PRODUCT RATINGS SYSTEM
-- =====================================================

-- =====================================================
-- PART 1: Add Rating Columns to Products Table
-- =====================================================

-- Add average rating column
ALTER TABLE products ADD COLUMN IF NOT EXISTS averagerating DECIMAL(3,2) DEFAULT 0.00;

-- Add total ratings count column
ALTER TABLE products ADD COLUMN IF NOT EXISTS totalratings INTEGER DEFAULT 0;

-- =====================================================
-- PART 2: Create Function to Calculate Product Ratings
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_product_rating(product_id_param UUID)
RETURNS TABLE(avg_rating DECIMAL, total_count INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ROUND(AVG(f.rating)::numeric, 2), 0.00)::DECIMAL(3,2) as avg_rating,
        COUNT(f.id)::INTEGER as total_count
    FROM feedback f
    INNER JOIN orders o ON f.orderid = o.id
    INNER JOIN jsonb_array_elements(o.items) as item ON true
    WHERE (item->>'productId')::uuid = product_id_param
    AND f.rating IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 3: Create Trigger to Update Product Ratings
-- =====================================================

CREATE OR REPLACE FUNCTION update_product_ratings_on_feedback()
RETURNS TRIGGER AS $$
DECLARE
    product_id_var UUID;
    rating_data RECORD;
BEGIN
    -- Get product ID from the order
    IF NEW.orderid IS NOT NULL THEN
        SELECT (item->>'productId')::uuid INTO product_id_var
        FROM orders o, jsonb_array_elements(o.items) as item
        WHERE o.id = NEW.orderid
        LIMIT 1;
        
        IF product_id_var IS NOT NULL THEN
            -- Calculate new rating
            SELECT * INTO rating_data FROM calculate_product_rating(product_id_var);
            
            -- Update product
            UPDATE products
            SET 
                averagerating = rating_data.avg_rating,
                totalratings = rating_data.total_count,
                updatedat = NOW()
            WHERE id = product_id_var;
            
            RAISE NOTICE '✅ Updated ratings for product %: avg=%, total=%', 
                product_id_var, rating_data.avg_rating, rating_data.total_count;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS feedback_update_product_ratings ON feedback;

-- Create trigger
CREATE TRIGGER feedback_update_product_ratings
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_product_ratings_on_feedback();

-- =====================================================
-- PART 4: Calculate Ratings for Existing Products
-- =====================================================

DO $$
DECLARE
    product_record RECORD;
    rating_data RECORD;
BEGIN
    FOR product_record IN SELECT id FROM products LOOP
        SELECT * INTO rating_data FROM calculate_product_rating(product_record.id);
        
        UPDATE products
        SET 
            averagerating = rating_data.avg_rating,
            totalratings = rating_data.total_count
        WHERE id = product_record.id;
    END LOOP;
    
    RAISE NOTICE '✅ Calculated ratings for all existing products';
END $$;

-- =====================================================
-- PART 5: Verify
-- =====================================================

-- Check new columns
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('averagerating', 'totalratings');

-- Check products with ratings
SELECT 
    id,
    name,
    averagerating,
    totalratings,
    stock
FROM products
ORDER BY averagerating DESC, totalratings DESC
LIMIT 10;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ PRODUCT RATINGS SYSTEM ADDED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ averageRating column (0.00-5.00)';
    RAISE NOTICE '  ✅ totalRatings column (count)';
    RAISE NOTICE '  ✅ Auto-update on feedback';
    RAISE NOTICE '  ✅ Trigger function created';
    RAISE NOTICE '  ✅ Existing products calculated';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ratings will now:';
    RAISE NOTICE '  1. Update when feedback is submitted';
    RAISE NOTICE '  2. Show average rating (★★★★☆)';
    RAISE NOTICE '  3. Show total count (e.g., "4.5 (23)")';
    RAISE NOTICE '  4. Display next to stock level';
    RAISE NOTICE '========================================';
END $$;
