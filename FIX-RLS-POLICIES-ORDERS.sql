-- =========================================================
-- FIX: Allow buyers AND MSMEs to update orders
-- Run this in Supabase SQL Editor
-- =========================================================

-- Enable Row Level Security (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing update policies
DROP POLICY IF EXISTS "Buyers can update their own orders" ON orders;
DROP POLICY IF EXISTS "Enable update for buyers" ON orders;
DROP POLICY IF EXISTS "Allow buyer updates" ON orders;
DROP POLICY IF EXISTS "MSME can update orders" ON orders;
DROP POLICY IF EXISTS "Enable update for msme" ON orders;
DROP POLICY IF EXISTS "Allow MSME updates" ON orders;

-- Create policy for BUYERS to update their orders (for Delivered status)
-- Use exact column name "buyerId" with quotes (camelCase)
CREATE POLICY "Allow buyer updates" ON orders
FOR UPDATE 
USING (
  auth.uid() = "buyerId"
);

-- Create policy for MSME to update orders
CREATE POLICY "Allow MSME updates" ON orders
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'msme'
  )
  OR
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Also ensure buyers can view their own orders
DROP POLICY IF EXISTS "Allow buyer select" ON orders;
CREATE POLICY "Allow buyer select" ON orders
FOR SELECT
USING (
  auth.uid() = "buyerId"
);

-- MSME can view orders
DROP POLICY IF EXISTS "Allow MSME select" ON orders;
CREATE POLICY "Allow MSME select" ON orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('msme', 'admin', 'subadmin')
  )
);

-- Verify policies are created
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;
