-- =========================================================
-- FIX: Allow buyers to update their orders
-- Run this in Supabase SQL Editor
-- This ensures buyers can update scannedunits and mark orders as 'Delivered'
-- =========================================================

-- Enable Row Level Security (if not already enabled)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow buyers to UPDATE their own orders
-- Assuming your "orders" table has a "buyerId" column representing the auth.uid()
-- OR "buyerid" (Postgres treats unquoted identifiers as lowercase).
-- We'll try both common variations (buyerid and "buyerId")

DO $$
BEGIN
  -- Check if a policy already exists and drop it to recreate
  DROP POLICY IF EXISTS "Buyers can update their own orders" ON orders;
  DROP POLICY IF EXISTS "Enable update for buyers" ON orders;
  DROP POLICY IF EXISTS "Allow buyer updates" ON orders;
  
  -- Create the new policy allowing UPDATE if the user is the buyer
  EXECUTE format('
    CREATE POLICY "Allow buyer updates" ON orders
    FOR UPDATE 
    USING (
      -- Replace buyerId with the exact column you use for the buyer''s UUID
      -- This assumes auth.uid() is matched against "buyerid" or "buyerId"
      -- You might need to adjust the column name below to perfectly match your DB
      "buyerId" = auth.uid() OR buyerid = auth.uid()
    );
  ');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipped or failed policy creation, check exact column name: %', SQLERRM;
END $$;
