-- =====================================================
-- CREATE AUTOMATIC RATING UPDATE TRIGGER
-- =====================================================
-- This ensures future feedback automatically updates product ratings

-- STEP 1: Drop old trigger if exists
DROP TRIGGER IF EXISTS trigger_update_product_rating ON feedback;
DROP FUNCTION IF EXISTS update_product_rating();

-- STEP 2: Create the function
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    total_count INTEGER;
BEGIN
    -- Only process if we have a productid and rating
    IF NEW.productid IS NOT NULL AND NEW.rating IS NOT NULL THEN
        
        RAISE NOTICE '🔔 Trigger fired for product: %', NEW.productid;
        
        -- Calculate average rating for this product
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COALESCE(COUNT(rating), 0)::INTEGER
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
        
        RAISE NOTICE '✅ Product updated: Avg=%, Count=%', avg_rating, total_count;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Create the trigger
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- STEP 4: Verify trigger was created
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_product_rating';

-- SUCCESS
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ AUTO-UPDATE TRIGGER CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'From now on:';
    RAISE NOTICE '  1. Buyer submits feedback';
    RAISE NOTICE '  2. Trigger fires automatically';
    RAISE NOTICE '  3. Product rating updates';
    RAISE NOTICE '  4. Stars show immediately';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Example with multiple buyers:';
    RAISE NOTICE '  Buyer 1: 5 stars → Product: 5.0 (1)';
    RAISE NOTICE '  Buyer 2: 4 stars → Product: 4.5 (2)';
    RAISE NOTICE '  Buyer 3: 5 stars → Product: 4.7 (3)';
    RAISE NOTICE '  Buyer 4: 3 stars → Product: 4.3 (4)';
    RAISE NOTICE '  Average calculated automatically!';
    RAISE NOTICE '========================================';
END $$;
