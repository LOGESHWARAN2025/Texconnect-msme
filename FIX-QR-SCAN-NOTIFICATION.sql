-- =====================================================
-- FIX: Ensure orders table has correct columns for QR scanning
-- and buyer phone for SMS/WhatsApp notifications
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Ensure scannedunits column exists (lowercase, as used by updateOrderScannedUnits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'scannedunits'
  ) THEN
    ALTER TABLE orders ADD COLUMN scannedunits TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added scannedunits column';
  ELSE
    RAISE NOTICE 'scannedunits column already exists';
  END IF;
END $$;

-- 2. Ensure totalunits and printedunits columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'totalunits'
  ) THEN
    ALTER TABLE orders ADD COLUMN totalunits INTEGER DEFAULT 0;
    RAISE NOTICE 'Added totalunits column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'printedunits'
  ) THEN
    ALTER TABLE orders ADD COLUMN printedunits INTEGER DEFAULT 0;
    RAISE NOTICE 'Added printedunits column';
  END IF;
END $$;

-- 3. Ensure buyerphone is stored in orders table (for notification)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'buyerphone'
  ) THEN
    ALTER TABLE orders ADD COLUMN buyerphone TEXT DEFAULT '';
    RAISE NOTICE 'Added buyerphone column';
  ELSE
    RAISE NOTICE 'buyerphone column already exists';
  END IF;
END $$;

-- 4. Backfill buyerphone from users table (optional, run once)
-- NOTE: Using quoted "buyerId" because the column was created with camelCase
UPDATE orders o
SET buyerphone = u.phone
FROM users u
WHERE o."buyerId" = u.id
  AND (o.buyerphone IS NULL OR o.buyerphone = '');

-- 5. Verify current state of columns
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('scannedunits', 'totalunits', 'printedunits', 'buyerphone', 'status')
ORDER BY column_name;

-- 6. Verify a sample order to confirm
SELECT 
  id,
  "buyerId",
  "buyerName",
  buyerphone,
  status,
  totalunits,
  printedunits,
  scannedunits
FROM orders
LIMIT 5;
