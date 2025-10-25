-- =====================================================
-- CHECK STOCK DECREASE ON ORDER PLACEMENT
-- =====================================================

-- =====================================================
-- STEP 1: Check current products and their stock
-- =====================================================

SELECT 
    p.id,
    p.name,
    p.stock as current_stock,
    p.initialstock as initial_stock,
    (p.initialstock - p.stock) as units_sold,
    u.username as msme_owner
FROM products p
LEFT JOIN users u ON p.supplierid = u.id
ORDER BY p.name;

-- =====================================================
-- STEP 2: Check recent orders and their items
-- =====================================================

SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    o.totalamount,
    o.createdat,
    jsonb_pretty(o.items) as order_items
FROM orders o
ORDER BY o.createdat DESC
LIMIT 10;

-- =====================================================
-- STEP 3: Match orders to product stock changes
-- =====================================================

-- This shows if stock decreased correctly for each order
SELECT 
    o.id as order_id,
    o."buyerName",
    o.status,
    item->>'productName' as product_name,
    (item->>'quantity')::integer as ordered_quantity,
    (item->>'productId')::uuid as product_id,
    p.stock as current_stock,
    p.initialstock as initial_stock,
    o.createdat as order_date
FROM orders o,
jsonb_array_elements(o.items) as item
LEFT JOIN products p ON p.id = (item->>'productId')::uuid
ORDER BY o.createdat DESC
LIMIT 20;

-- =====================================================
-- STEP 4: Check inventory table (if still in use)
-- =====================================================

-- Check if inventory table exists and has data
SELECT 
    i.id,
    i.name,
    i.quantity as inventory_stock,
    i.supplierid,
    u.username as msme_owner
FROM inventory i
LEFT JOIN users u ON i.supplierid = u.id
ORDER BY i.name;

-- =====================================================
-- STEP 5: Compare products vs inventory stock
-- =====================================================

-- This shows if products and inventory are in sync
SELECT 
    p.name as product_name,
    p.stock as product_stock,
    i.quantity as inventory_stock,
    CASE 
        WHEN p.stock = i.quantity THEN '✅ IN SYNC'
        ELSE '❌ OUT OF SYNC'
    END as sync_status,
    u.username as msme_owner
FROM products p
LEFT JOIN inventory i ON p.name = i.name AND p.supplierid = i.supplierid
LEFT JOIN users u ON p.supplierid = u.id
ORDER BY p.name;

-- =====================================================
-- STEP 6: Test stock decrease trigger
-- =====================================================

-- Check if trigger exists for stock decrease
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
OR trigger_name LIKE '%stock%'
OR trigger_name LIKE '%inventory%';

-- =====================================================
-- STEP 7: Simulate order and check stock
-- =====================================================

-- Get a product with stock > 0
SELECT 
    id,
    name,
    stock,
    price,
    supplierid
FROM products
WHERE stock > 0
LIMIT 1;

-- Note: After placing an order for this product, run STEP 1 again
-- The stock should decrease by the ordered quantity

-- =====================================================
-- RESULTS INTERPRETATION
-- =====================================================

/*
STEP 1: Current Stock Status
- Shows all products and their current stock
- initial_stock - current_stock = units_sold
- If units_sold = 0, no orders placed yet

STEP 2: Recent Orders
- Shows last 10 orders
- Check items field for product details
- Verify quantity ordered

STEP 3: Order-Product Matching
- Shows which products were ordered
- ordered_quantity = how many units
- current_stock = remaining stock
- If stock didn't decrease, trigger not working

STEP 4: Inventory Table
- Shows if inventory table has data
- May be deprecated (merged with products)

STEP 5: Products vs Inventory Sync
- ✅ IN SYNC: Both have same stock
- ❌ OUT OF SYNC: Different values
- If out of sync, inventory not updating

STEP 6: Check Triggers
- Should show trigger that decreases stock on order
- If empty, no automatic stock decrease

COMMON ISSUES:

Issue 1: Stock doesn't decrease after order
→ Trigger missing or not working
→ Check placeOrder function in context
→ Should manually update stock

Issue 2: Products and Inventory out of sync
→ Inventory table not being updated
→ May need to update both tables
→ Or deprecate inventory table

Issue 3: Stock decreases but not in real-time
→ Real-time not enabled
→ Run ENABLE-REALTIME-UPDATES.sql

Issue 4: Negative stock values
→ No stock validation before order
→ checkStockAvailability not working
→ Add validation in placeOrder

Issue 5: Stock decreases more than ordered
→ Bug in stock calculation
→ Check order items quantity field
→ Verify placeOrder logic
*/

-- =====================================================
-- STEP 8: Manual stock decrease test
-- =====================================================

-- Uncomment to manually test stock decrease:
/*
DO $$
DECLARE
    test_product_id uuid;
    test_product_name text;
    old_stock integer;
    new_stock integer;
BEGIN
    -- Get a product with stock
    SELECT id, name, stock INTO test_product_id, test_product_name, old_stock
    FROM products
    WHERE stock > 0
    LIMIT 1;
    
    IF test_product_id IS NULL THEN
        RAISE NOTICE '❌ No products with stock available';
        RETURN;
    END IF;
    
    RAISE NOTICE '📦 Testing stock decrease for: %', test_product_name;
    RAISE NOTICE '📊 Current stock: %', old_stock;
    
    -- Decrease stock by 1
    UPDATE products
    SET stock = stock - 1
    WHERE id = test_product_id;
    
    -- Check new stock
    SELECT stock INTO new_stock
    FROM products
    WHERE id = test_product_id;
    
    RAISE NOTICE '📊 New stock: %', new_stock;
    RAISE NOTICE '✅ Stock decreased by: %', (old_stock - new_stock);
    
    -- Rollback the test
    UPDATE products
    SET stock = old_stock
    WHERE id = test_product_id;
    
    RAISE NOTICE '🔄 Stock restored to: %', old_stock;
END $$;
*/

-- =====================================================
-- STEP 9: Check placeOrder function logic
-- =====================================================

-- This checks if there's a database function for placing orders
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%order%' OR routine_name LIKE '%stock%');

-- =====================================================
-- TESTING PROCEDURE
-- =====================================================

/*
MANUAL TEST:

1. Note current stock:
   SELECT name, stock FROM products WHERE name = 'Product X';
   Example: stock = 100

2. Place order from buyer dashboard:
   - Login as Buyer
   - Browse products
   - Order "Product X" with quantity = 5

3. Check stock again:
   SELECT name, stock FROM products WHERE name = 'Product X';
   Expected: stock = 95 (100 - 5)

4. Check MSME dashboard:
   - Login as MSME (product owner)
   - Go to "Products" menu
   - Find "Product X"
   - Stock should show 95

5. Check Inventory menu (if exists):
   - Go to "Inventory" menu
   - Find "Product X"
   - Stock should show 95

6. If stock didn't decrease:
   → Check console for errors
   → Verify placeOrder function in SupabaseContext.tsx
   → Check if stock update is in the code

EXPECTED BEHAVIOR:

When order is placed:
1. Stock decreases in products table ✅
2. Stock updates in Products menu (MSME) ✅
3. Stock updates in Inventory menu (MSME) ✅
4. Stock updates in Browse Products (Buyer) ✅
5. Real-time update (no refresh needed) ✅

If any step fails, there's a bug in:
- placeOrder function
- Stock update logic
- Real-time subscription
- Inventory sync
*/
