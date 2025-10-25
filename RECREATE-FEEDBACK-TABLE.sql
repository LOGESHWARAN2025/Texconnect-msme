-- =====================================================
-- RECREATE FEEDBACK TABLE WITH CORRECT COLUMN NAMES
-- =====================================================

-- =====================================================
-- STEP 1: Drop existing table and dependencies
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS feedback_update_product_ratings ON feedback;
DROP TRIGGER IF EXISTS feedback_updated_at_trigger ON feedback;

-- Drop functions
DROP FUNCTION IF EXISTS update_feedback_updated_at();
DROP FUNCTION IF EXISTS update_product_ratings_on_feedback();

-- Drop table (this will also drop all policies and indexes)
DROP TABLE IF EXISTS feedback CASCADE;

-- =====================================================
-- STEP 2: Create table with lowercase column names
-- =====================================================

CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    userrole TEXT NOT NULL CHECK (userrole IN ('msme', 'buyer', 'admin')),
    orderid UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT CHECK (category IN ('product_quality', 'delivery', 'service', 'platform', 'other')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    adminresponse TEXT,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create Indexes
-- =====================================================

CREATE INDEX idx_feedback_user_id ON feedback(userid);
CREATE INDEX idx_feedback_user_role ON feedback(userrole);
CREATE INDEX idx_feedback_order_id ON feedback(orderid);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(createdat);

-- =====================================================
-- STEP 4: Enable RLS and Create Policies
-- =====================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
ON feedback FOR SELECT
USING (userid::text = auth.uid()::text);

-- Users can create their own feedback
CREATE POLICY "Users can create feedback"
ON feedback FOR INSERT
WITH CHECK (userid::text = auth.uid()::text);

-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
ON feedback FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = auth.uid()::text
        AND users.role = 'admin'
    )
);

-- Admin can update feedback
CREATE POLICY "Admin can update feedback"
ON feedback FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = auth.uid()::text
        AND users.role = 'admin'
    )
);

-- =====================================================
-- STEP 5: Create Trigger for Updated At
-- =====================================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at_trigger
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- =====================================================
-- STEP 6: Create Trigger for Product Ratings
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
            SELECT 
                COALESCE(ROUND(AVG(f.rating)::numeric, 2), 0.00)::DECIMAL(3,2) as avg_rating,
                COUNT(f.id)::INTEGER as total_count
            INTO rating_data
            FROM feedback f
            INNER JOIN orders o ON f.orderid = o.id
            INNER JOIN jsonb_array_elements(o.items) as item ON true
            WHERE (item->>'productId')::uuid = product_id_var
            AND f.rating IS NOT NULL;
            
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

CREATE TRIGGER feedback_update_product_ratings
    AFTER INSERT OR UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_product_ratings_on_feedback();

-- =====================================================
-- STEP 7: Verify
-- =====================================================

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'feedback';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FEEDBACK TABLE RECREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All column names are now lowercase:';
    RAISE NOTICE '  - userid';
    RAISE NOTICE '  - username';
    RAISE NOTICE '  - userrole';
    RAISE NOTICE '  - orderid';
    RAISE NOTICE '  - adminresponse';
    RAISE NOTICE '  - createdat';
    RAISE NOTICE '  - updatedat';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ RLS policies created';
    RAISE NOTICE '  ✅ Indexes created';
    RAISE NOTICE '  ✅ Triggers created';
    RAISE NOTICE '  ✅ Product ratings auto-update';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ready to use! Test by submitting feedback.';
    RAISE NOTICE '========================================';
END $$;
