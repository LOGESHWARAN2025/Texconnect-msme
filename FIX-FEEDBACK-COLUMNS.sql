-- =====================================================
-- FIX FEEDBACK TABLE COLUMN NAMES
-- =====================================================

-- Check current column names
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'feedback'
ORDER BY ordinal_position;

-- The feedback table should have these columns:
-- userId, userName, userRole, orderId, rating, comment, category, status, adminResponse, createdAt, updatedAt

-- If columns are lowercase, they're already correct
-- Supabase returns them as lowercase by default

-- =====================================================
-- VERIFY DATA EXISTS
-- =====================================================

-- Check if there's any feedback data
SELECT 
    COUNT(*) as total_feedback,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM feedback;

-- Show sample feedback
SELECT 
    id,
    "userName",
    "userRole",
    rating,
    category,
    status,
    "createdAt"
FROM feedback
ORDER BY "createdAt" DESC
LIMIT 5;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
    feedback_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO feedback_count FROM feedback;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FEEDBACK TABLE CHECK';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total feedback entries: %', feedback_count;
    
    IF feedback_count = 0 THEN
        RAISE NOTICE '⚠️ No feedback data yet';
        RAISE NOTICE 'Feedback will appear after:';
        RAISE NOTICE '  1. Buyer receives delivered order';
        RAISE NOTICE '  2. Buyer clicks Feedback button';
        RAISE NOTICE '  3. Buyer submits rating & comment';
    ELSE
        RAISE NOTICE '✅ Feedback data exists!';
        RAISE NOTICE 'Check Admin Dashboard → Feedback Logs';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
