-- QUICK FIX: Products Not Showing After Add
-- Run this script in Supabase SQL Editor

-- ============================================
-- STEP 1: Fix RLS Policies
-- ============================================

-- Drop and recreate SELECT policies
DROP POLICY IF EXISTS "msme_read_own_products" ON public.products;
DROP POLICY IF EXISTS "buyers_read_all_products" ON public.products;

-- MSME: Read their own products
CREATE POLICY "msme_read_own_products"
ON public.products
FOR SELECT
TO authenticated
USING (msmeid = auth.uid());

-- Buyers: Read all products
CREATE POLICY "buyers_read_all_products"
ON public.products
FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- STEP 2: Approve MSME Users
-- ============================================

UPDATE public.users 
SET isapproved = true 
WHERE role = 'msme' AND isapproved = false;

-- ============================================
-- STEP 3: Verify Setup
-- ============================================

-- Check policies
SELECT 
    policyname,
    cmd as operation
FROM pg_policies 
WHERE tablename = 'products'
ORDER BY policyname;

-- Check MSME users
SELECT 
    id,
    email,
    role,
    isapproved
FROM public.users 
WHERE role = 'msme';

-- Check recent products
SELECT 
    id,
    name,
    msmeid,
    stock,
    createdat
FROM public.products 
ORDER BY createdat DESC 
LIMIT 5;

-- Check realtime (should already be enabled)
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'products'
    ) THEN '✅ Realtime ENABLED' 
    ELSE '❌ Realtime DISABLED' 
    END as realtime_status;

-- ============================================
-- DONE! Now test adding a product in the app
-- ============================================
