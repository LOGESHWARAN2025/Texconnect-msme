-- =====================================================
-- CREATE FEEDBACK SYSTEM
-- =====================================================

-- =====================================================
-- PART 1: Create Feedback Table
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback (
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
-- PART 2: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(userid);
CREATE INDEX IF NOT EXISTS idx_feedback_user_role ON feedback(userrole);
CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(orderid);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(createdat);

-- =====================================================
-- PART 3: Enable RLS (Row Level Security)
-- =====================================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can update feedback" ON feedback;

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

-- Admin can update feedback (add response, change status)
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
-- PART 4: Create Trigger for Updated At
-- =====================================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS feedback_updated_at_trigger ON feedback;
CREATE TRIGGER feedback_updated_at_trigger
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- =====================================================
-- PART 5: Sample Data (Optional)
-- =====================================================

-- Insert sample feedback (only if users exist)
-- DO $$
-- DECLARE
--     buyer_id UUID;
--     msme_id UUID;
-- BEGIN
--     SELECT id INTO buyer_id FROM users WHERE role = 'buyer' LIMIT 1;
--     SELECT id INTO msme_id FROM users WHERE role = 'msme' LIMIT 1;
--     
--     IF buyer_id IS NOT NULL THEN
--         INSERT INTO feedback ("userId", "userName", "userRole", rating, comment, category)
--         VALUES (buyer_id, 'Sample Buyer', 'buyer', 5, 'Great product quality!', 'product_quality');
--     END IF;
--     
--     IF msme_id IS NOT NULL THEN
--         INSERT INTO feedback ("userId", "userName", "userRole", rating, comment, category)
--         VALUES (msme_id, 'Sample MSME', 'msme', 4, 'Platform is easy to use', 'platform');
--     END IF;
-- END $$;

-- =====================================================
-- PART 6: Verify
-- =====================================================

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'feedback';

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
    RAISE NOTICE '✅ FEEDBACK SYSTEM CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ Feedback table with ratings & comments';
    RAISE NOTICE '  ✅ Order-linked feedback';
    RAISE NOTICE '  ✅ Category-based feedback';
    RAISE NOTICE '  ✅ Admin response system';
    RAISE NOTICE '  ✅ RLS policies for security';
    RAISE NOTICE '  ✅ Performance indexes';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Feedback Flow:';
    RAISE NOTICE '  1. Buyer order delivered → Feedback button';
    RAISE NOTICE '  2. User submits feedback';
    RAISE NOTICE '  3. Admin views in User Feedback menu';
    RAISE NOTICE '  4. Admin can filter by role';
    RAISE NOTICE '  5. Admin can respond';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next: Update React components!';
    RAISE NOTICE '========================================';
END $$;
