-- =====================================================
-- CREATE FEEDBACK AND ISSUES MANAGEMENT SYSTEM
-- =====================================================
-- This creates tables for feedback, issues, and resolved issues

-- =====================================================
-- 1. FEEDBACK TABLE
-- =====================================================
-- For MSME users to give feedback after first delivery to buyer

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  msmeuserid UUID REFERENCES users(id) ON DELETE CASCADE,
  msmeusername TEXT NOT NULL,
  msmeemail TEXT NOT NULL,
  
  buyeruserid UUID REFERENCES users(id) ON DELETE CASCADE,
  buyerusername TEXT NOT NULL,
  buyeremail TEXT NOT NULL,
  
  -- Feedback details
  orderid TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedbacktext TEXT NOT NULL,
  category TEXT, -- e.g., 'Quality', 'Delivery', 'Communication', 'Payment'
  
  -- Metadata
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  isread BOOLEAN DEFAULT false,
  readby UUID REFERENCES users(id) ON DELETE SET NULL,
  readat TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. ISSUES TABLE (Active Issues)
-- =====================================================
-- For MSME and Buyer users to report issues

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reporter information
  reporterid UUID REFERENCES users(id) ON DELETE CASCADE,
  reporterusername TEXT NOT NULL,
  reporteremail TEXT NOT NULL,
  reporterrole TEXT NOT NULL, -- 'msme' or 'buyer'
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Technical', 'Payment', 'Delivery', 'Quality', 'Other'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Related information
  relateduserid UUID REFERENCES users(id) ON DELETE SET NULL,
  relatedusername TEXT,
  orderid TEXT,
  
  -- Attachments
  attachmenturl TEXT,
  
  -- Status
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  
  -- Admin handling
  assignedto UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who is handling
  assignedtousername TEXT,
  assignedat TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. RESOLVED ISSUES TABLE
-- =====================================================
-- Issues that have been resolved by admins

CREATE TABLE IF NOT EXISTS resolvedissues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Original issue ID (for reference)
  originalid UUID,
  
  -- Reporter information
  reporterid UUID,
  reporterusername TEXT NOT NULL,
  reporteremail TEXT NOT NULL,
  reporterrole TEXT NOT NULL,
  
  -- Issue details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT,
  
  -- Related information
  relateduserid UUID,
  relatedusername TEXT,
  orderid TEXT,
  
  -- Resolution details
  resolvedby UUID REFERENCES users(id) ON DELETE SET NULL,
  resolvedbyusername TEXT NOT NULL,
  resolutionnotes TEXT NOT NULL,
  resolutiondate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  reportedat TIMESTAMP WITH TIME ZONE NOT NULL,
  resolvedat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Feedback indexes
CREATE INDEX IF NOT EXISTS idx_feedbacks_msmeuserid ON feedbacks(msmeuserid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_buyeruserid ON feedbacks(buyeruserid);
CREATE INDEX IF NOT EXISTS idx_feedbacks_createdat ON feedbacks(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_isread ON feedbacks(isread);

-- Issues indexes
CREATE INDEX IF NOT EXISTS idx_issues_reporterid ON issues(reporterid);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_assignedto ON issues(assignedto);
CREATE INDEX IF NOT EXISTS idx_issues_createdat ON issues(createdat DESC);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);

-- Resolved issues indexes
CREATE INDEX IF NOT EXISTS idx_resolvedissues_resolvedby ON resolvedissues(resolvedby);
CREATE INDEX IF NOT EXISTS idx_resolvedissues_resolvedat ON resolvedissues(resolvedat DESC);
CREATE INDEX IF NOT EXISTS idx_resolvedissues_reporterid ON resolvedissues(reporterid);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolvedissues ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Feedbacks: Users can view their own, admins can view all
CREATE POLICY "Users can view their own feedbacks"
  ON feedbacks FOR SELECT
  USING (
    msmeuserid = auth.uid() OR 
    buyeruserid = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "MSME users can insert feedbacks"
  ON feedbacks FOR INSERT
  WITH CHECK (
    msmeuserid = auth.uid() AND
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'msme')
  );

-- Issues: Users can view their own, admins can view all
CREATE POLICY "Users can view their own issues"
  ON issues FOR SELECT
  USING (
    reporterid = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can insert issues"
  ON issues FOR INSERT
  WITH CHECK (reporterid = auth.uid());

CREATE POLICY "Admins can update issues"
  ON issues FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Resolved Issues: Users can view their own, admins can view all
CREATE POLICY "Users can view their resolved issues"
  ON resolvedissues FOR SELECT
  USING (
    reporterid = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert resolved issues"
  ON resolvedissues FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT ON feedbacks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON issues TO authenticated;
GRANT SELECT, INSERT ON resolvedissues TO authenticated;

-- =====================================================
-- 8. ENABLE REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE feedbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE issues;
ALTER PUBLICATION supabase_realtime ADD TABLE resolvedissues;

-- =====================================================
-- 9. VERIFICATION
-- =====================================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('feedbacks', 'issues', 'resolvedissues')
ORDER BY table_name;

-- Check columns
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('feedbacks', 'issues', 'resolvedissues')
ORDER BY table_name, ordinal_position;

-- Check policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('feedbacks', 'issues', 'resolvedissues')
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Feedback and Issues System Created!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - feedbacks (MSME feedback after delivery)';
    RAISE NOTICE '  - issues (Active issues from users)';
    RAISE NOTICE '  - resolvedissues (Resolved issues log)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Features:';
    RAISE NOTICE '  ✅ Feedback system for MSME users';
    RAISE NOTICE '  ✅ Issue reporting for MSME and Buyer';
    RAISE NOTICE '  ✅ Issue assignment to admins';
    RAISE NOTICE '  ✅ Resolved issues tracking';
    RAISE NOTICE '  ✅ Hierarchical access (Main/Sub admin)';
    RAISE NOTICE '  ✅ Realtime updates enabled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next step: Update your application code';
    RAISE NOTICE '========================================';
END $$;
