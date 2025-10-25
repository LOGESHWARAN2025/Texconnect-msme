-- =====================================================
-- COMPLETE FIX FOR STATUS UPDATE
-- =====================================================

-- =====================================================
-- PART 1: Check Current State
-- =====================================================

-- Check orders table
SELECT id, "buyerName", status, date FROM orders ORDER BY date DESC;

-- Check RLS policies on orders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- =====================================================
-- PART 2: Fix Status Constraint
-- =====================================================

-- Drop old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with Accepted
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('Pending', 'Accepted', 'Shipped', 'Delivered', 'Cancelled'));

-- =====================================================
-- PART 3: Fix RLS Policies for Updates
-- =====================================================

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update orders" ON orders;
DROP POLICY IF EXISTS "MSME can update orders" ON orders;
DROP POLICY IF EXISTS "MSME can update order status" ON orders;

-- Create new policy allowing MSME to update orders
CREATE POLICY "MSME can update order status"
ON orders FOR UPDATE
USING (
  -- MSME can update orders for their products
  EXISTS (
    SELECT 1 FROM inventory i, jsonb_array_elements(orders.items) as item
    WHERE i.id::text = (item->>'productId')
    AND i.msmeid::text = auth.uid()::text
  )
)
WITH CHECK (
  -- MSME can update orders for their products
  EXISTS (
    SELECT 1 FROM inventory i, jsonb_array_elements(orders.items) as item
    WHERE i.id::text = (item->>'productId')
    AND i.msmeid::text = auth.uid()::text
  )
);

-- Allow buyers to view their orders
DROP POLICY IF EXISTS "Buyers can view own orders" ON orders;
CREATE POLICY "Buyers can view own orders"
ON orders FOR SELECT
USING ("buyerId"::text = auth.uid()::text);

-- Allow MSME to view orders for their products
DROP POLICY IF EXISTS "MSME can view orders" ON orders;
CREATE POLICY "MSME can view orders"
ON orders FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM inventory i, jsonb_array_elements(orders.items) as item
    WHERE i.id::text = (item->>'productId')
    AND i.msmeid::text = auth.uid()::text
  )
);

-- =====================================================
-- PART 4: Update Existing Orders to Proper Case
-- =====================================================

UPDATE orders SET status = 'Pending' WHERE LOWER(status) = 'pending' OR status IS NULL;
UPDATE orders SET status = 'Accepted' WHERE LOWER(status) = 'accepted';
UPDATE orders SET status = 'Shipped' WHERE LOWER(status) = 'shipped';
UPDATE orders SET status = 'Delivered' WHERE LOWER(status) = 'delivered';
UPDATE orders SET status = 'Cancelled' WHERE LOWER(status) = 'cancelled';

-- =====================================================
-- PART 5: Verify Everything
-- =====================================================

-- Check constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'orders'::regclass 
AND conname = 'orders_status_check';

-- Check policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- Check orders
SELECT 
    id,
    "buyerId"::text,
    "buyerName",
    status,
    total,
    jsonb_array_length(items) as items
FROM orders
ORDER BY date DESC;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ STATUS UPDATE COMPLETE FIX DONE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Fixed:';
    RAISE NOTICE '  ✅ Status constraint (added Accepted)';
    RAISE NOTICE '  ✅ RLS policies (MSME can update)';
    RAISE NOTICE '  ✅ All orders updated to proper case';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Status options:';
    RAISE NOTICE '  - Pending';
    RAISE NOTICE '  - Accepted';
    RAISE NOTICE '  - Shipped';
    RAISE NOTICE '  - Delivered';
    RAISE NOTICE '  - Cancelled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh app (Ctrl+R)';
    RAISE NOTICE '  2. Try updating status';
    RAISE NOTICE '  3. Check console for errors';
    RAISE NOTICE '========================================';
END $$;
