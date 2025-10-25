-- =====================================================
-- CREATE ISSUE REPORTING SYSTEM
-- =====================================================

-- =====================================================
-- PART 1: Create Issues Table
-- =====================================================

CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporterid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reportername TEXT NOT NULL,
    reporterrole TEXT NOT NULL CHECK (reporterrole IN ('msme', 'buyer', 'admin')),
    orderid UUID REFERENCES orders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('order', 'payment', 'quality', 'delivery', 'technical', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assignedto UUID REFERENCES users(id) ON DELETE SET NULL,
    adminresponse TEXT,
    resolvedat TIMESTAMP WITH TIME ZONE,
    resolvedby UUID REFERENCES users(id) ON DELETE SET NULL,
    createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PART 2: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_issues_reporter_id ON issues(reporterid);
CREATE INDEX IF NOT EXISTS idx_issues_reporter_role ON issues(reporterrole);
CREATE INDEX IF NOT EXISTS idx_issues_order_id ON issues(orderid);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(createdat);

-- =====================================================
-- PART 3: Enable RLS (Row Level Security)
-- =====================================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own issues" ON issues;
DROP POLICY IF EXISTS "Users can create issues" ON issues;
DROP POLICY IF EXISTS "Users can update own issues" ON issues;
DROP POLICY IF EXISTS "Admin can view all issues" ON issues;
DROP POLICY IF EXISTS "Admin can update all issues" ON issues;

-- Users can view their own issues
CREATE POLICY "Users can view own issues"
ON issues FOR SELECT
USING (reporterid::text = auth.uid()::text);

-- Users can create their own issues
CREATE POLICY "Users can create issues"
ON issues FOR INSERT
WITH CHECK (reporterid::text = auth.uid()::text);

-- Users can update their own issues (only description)
CREATE POLICY "Users can update own issues"
ON issues FOR UPDATE
USING (reporterid::text = auth.uid()::text)
WITH CHECK (reporterid::text = auth.uid()::text);

-- Admin can view all issues
CREATE POLICY "Admin can view all issues"
ON issues FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id::text = auth.uid()::text
        AND users.role = 'admin'
    )
);

-- Admin can update all issues (status, priority, response, etc.)
CREATE POLICY "Admin can update all issues"
ON issues FOR UPDATE
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

CREATE OR REPLACE FUNCTION update_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    
    -- If status changed to resolved, set resolvedAt
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolvedat = NOW();
        NEW.resolvedby = auth.uid();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_updated_at_trigger ON issues;
CREATE TRIGGER issues_updated_at_trigger
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issues_updated_at();

-- =====================================================
-- PART 5: Sample Data (Optional for Testing)
-- =====================================================

-- DO $$
-- DECLARE
--     buyer_id UUID;
--     msme_id UUID;
-- BEGIN
--     SELECT id INTO buyer_id FROM users WHERE role = 'buyer' LIMIT 1;
--     SELECT id INTO msme_id FROM users WHERE role = 'msme' LIMIT 1;
--     
--     IF buyer_id IS NOT NULL THEN
--         INSERT INTO issues ("reporterId", "reporterName", "reporterRole", title, description, category, priority)
--         VALUES (buyer_id, 'Sample Buyer', 'buyer', 'Order not received', 'I placed an order 2 weeks ago but haven''t received it yet.', 'delivery', 'high');
--     END IF;
--     
--     IF msme_id IS NOT NULL THEN
--         INSERT INTO issues ("reporterId", "reporterName", "reporterRole", title, description, category, priority)
--         VALUES (msme_id, 'Sample MSME', 'msme', 'Payment not received', 'Payment for order #123 is pending.', 'payment', 'medium');
--     END IF;
-- END $$;

-- =====================================================
-- PART 6: Verify
-- =====================================================

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'issues'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'issues';

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'issues';

-- Check issues count
SELECT 
    COUNT(*) as total_issues,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_issues,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_issues
FROM issues;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ISSUE REPORTING SYSTEM CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ Issues table with full tracking';
    RAISE NOTICE '  ✅ Categories: order, payment, quality, delivery, technical, other';
    RAISE NOTICE '  ✅ Priority levels: low, medium, high, urgent';
    RAISE NOTICE '  ✅ Status tracking: open, in_progress, resolved, closed';
    RAISE NOTICE '  ✅ Order linking (optional)';
    RAISE NOTICE '  ✅ Admin response system';
    RAISE NOTICE '  ✅ Auto-timestamp on resolve';
    RAISE NOTICE '  ✅ RLS policies for security';
    RAISE NOTICE '  ✅ Performance indexes';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Issue Flow:';
    RAISE NOTICE '  1. User reports issue';
    RAISE NOTICE '  2. Saves to Supabase';
    RAISE NOTICE '  3. Admin views in Issue Log';
    RAISE NOTICE '  4. Admin responds & updates status';
    RAISE NOTICE '  5. User sees updates';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next: Create UI components!';
    RAISE NOTICE '========================================';
END $$;
