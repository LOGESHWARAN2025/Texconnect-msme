-- =====================================================
-- RECREATE ISSUES TABLE WITH CORRECT COLUMN NAMES
-- =====================================================

-- =====================================================
-- STEP 1: Drop existing table and dependencies
-- =====================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS issues_updated_at_trigger ON issues;

-- Drop functions
DROP FUNCTION IF EXISTS update_issues_updated_at();

-- Drop table (this will also drop all policies and indexes)
DROP TABLE IF EXISTS issues CASCADE;

-- =====================================================
-- STEP 2: Create table with lowercase column names
-- =====================================================

CREATE TABLE issues (
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
-- STEP 3: Create Indexes
-- =====================================================

CREATE INDEX idx_issues_reporter_id ON issues(reporterid);
CREATE INDEX idx_issues_reporter_role ON issues(reporterrole);
CREATE INDEX idx_issues_order_id ON issues(orderid);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created_at ON issues(createdat);

-- =====================================================
-- STEP 4: Enable RLS and Create Policies
-- =====================================================

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Users can view their own issues
CREATE POLICY "Users can view own issues"
ON issues FOR SELECT
USING (reporterid::text = auth.uid()::text);

-- Users can create their own issues
CREATE POLICY "Users can create issues"
ON issues FOR INSERT
WITH CHECK (reporterid::text = auth.uid()::text);

-- Users can update their own issues
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

-- Admin can update all issues
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
-- STEP 5: Create Trigger for Updated At
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

CREATE TRIGGER issues_updated_at_trigger
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issues_updated_at();

-- =====================================================
-- STEP 6: Verify
-- =====================================================

-- Check table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'issues'
ORDER BY ordinal_position;

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'issues';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ ISSUES TABLE RECREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All column names are now lowercase:';
    RAISE NOTICE '  - reporterid';
    RAISE NOTICE '  - reportername';
    RAISE NOTICE '  - reporterrole';
    RAISE NOTICE '  - orderid';
    RAISE NOTICE '  - assignedto';
    RAISE NOTICE '  - adminresponse';
    RAISE NOTICE '  - resolvedat';
    RAISE NOTICE '  - resolvedby';
    RAISE NOTICE '  - createdat';
    RAISE NOTICE '  - updatedat';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ RLS policies created';
    RAISE NOTICE '  ✅ Indexes created';
    RAISE NOTICE '  ✅ Triggers created';
    RAISE NOTICE '  ✅ Auto-resolve tracking';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Ready to use! Test by reporting an issue.';
    RAISE NOTICE '========================================';
END $$;
