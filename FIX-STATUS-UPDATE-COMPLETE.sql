-- =====================================================
-- COMPLETE FIX FOR STATUS UPDATE
-- =====================================================

-- =====================================================
-- PART 1: Check Current State
-- =====================================================

-- Check orders table
SELECT id, "buyerName", status FROM orders ORDER BY id DESC;

-- Check RLS policies on orders
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'orders';

-- =====================================================
-- PART 2: Fix Status Constraint
-- =====================================================

-- Ensure QR tracking columns exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printedUnits INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "totalUnits" INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scannedUnits TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Drop old constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with Accepted
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN (
  'Pending',
  'Accepted',
  'Ready to Prepare',
  'Prepared',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
));

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
UPDATE orders SET status = 'Ready to Prepare' WHERE LOWER(status) IN ('ready to prepare', 'ready_to_prepare', 'readytoprepare');
UPDATE orders SET status = 'Prepared' WHERE LOWER(status) = 'prepared';
UPDATE orders SET status = 'Shipped' WHERE LOWER(status) = 'shipped';
UPDATE orders SET status = 'Out for Delivery' WHERE LOWER(status) IN ('out for delivery', 'out_for_delivery', 'outfordelivery');
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
    status
FROM orders
ORDER BY id DESC;

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
    RAISE NOTICE '  - Ready to Prepare';
    RAISE NOTICE '  - Prepared';
    RAISE NOTICE '  - Shipped';
    RAISE NOTICE '  - Out for Delivery';
    RAISE NOTICE '  - Delivered';
    RAISE NOTICE '  - Cancelled';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh app (Ctrl+R)';
    RAISE NOTICE '  2. Try updating status';
    RAISE NOTICE '  3. Check console for errors';
    RAISE NOTICE '========================================';
END $$;


-- =============================================
-- TEXTILE MATERIAL MASTER (Catalog + Attributes + Prices)
-- =============================================

-- 1) Categories
CREATE TABLE IF NOT EXISTS public.material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug)
);

-- 2) Materials
CREATE TABLE IF NOT EXISTS public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.material_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  synonyms text[] NOT NULL DEFAULT '{}'::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug)
);

-- 3) Attribute definitions
CREATE TABLE IF NOT EXISTS public.material_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  label text NOT NULL,
  data_type text NOT NULL DEFAULT 'text' CHECK (data_type IN ('text','number','bool','select')),
  unit text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key)
);

-- 4) Attribute values per material
CREATE TABLE IF NOT EXISTS public.material_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES public.material_attributes(id) ON DELETE CASCADE,
  value_text text,
  value_number numeric,
  value_bool boolean,
  value_select text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (material_id, attribute_id)
);

-- 5) Prices (manual/supplier/market snapshots)
CREATE TABLE IF NOT EXISTS public.material_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  unit text NOT NULL DEFAULT 'kg',
  region_country text,
  region_state text,
  region_district text,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','supplier','market','api')),
  source_ref text,
  effective_date date NOT NULL DEFAULT (now()::date),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_prices ENABLE ROW LEVEL SECURITY;

-- Public read access (catalog)
DROP POLICY IF EXISTS "read_material_categories" ON public.material_categories;
CREATE POLICY "read_material_categories" ON public.material_categories
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "read_materials" ON public.materials;
CREATE POLICY "read_materials" ON public.materials
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "read_material_attributes" ON public.material_attributes;
CREATE POLICY "read_material_attributes" ON public.material_attributes
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "read_material_attribute_values" ON public.material_attribute_values;
CREATE POLICY "read_material_attribute_values" ON public.material_attribute_values
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "read_material_prices" ON public.material_prices;
CREATE POLICY "read_material_prices" ON public.material_prices
FOR SELECT
USING (true);

-- Only authenticated users can write price snapshots (manual/supplier)
DROP POLICY IF EXISTS "insert_material_prices_authenticated" ON public.material_prices;
CREATE POLICY "insert_material_prices_authenticated" ON public.material_prices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "update_material_prices_owner" ON public.material_prices;
CREATE POLICY "update_material_prices_owner" ON public.material_prices
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "delete_material_prices_owner" ON public.material_prices;
CREATE POLICY "delete_material_prices_owner" ON public.material_prices
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '✅ Textile material master tables ensured: material_categories, materials, material_attributes, material_attribute_values, material_prices';
END $$;
