-- =====================================================
-- FINAL FIX - This will work 100%
-- =====================================================

-- Step 1: Show current state
SELECT 'BEFORE FIX' as step;
SELECT id::text, username, rating, productid::text FROM feedback;
SELECT id::text, name, averagerating, totalratings FROM products;

-- Step 2: Fix productid in feedback (link to product via order)
UPDATE feedback f
SET productid = (
    SELECT (items->0->>'productId')::uuid
    FROM orders
    WHERE id = f.orderid
)
WHERE productid IS NULL;

-- Step 3: Show feedback after fix
SELECT 'AFTER PRODUCTID FIX' as step;
SELECT id::text, username, rating, productid::text FROM feedback;

-- Step 4: Update product ratings
UPDATE products p
SET 
    averagerating = (
        SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
        FROM feedback
        WHERE productid = p.id AND rating IS NOT NULL
    ),
    totalratings = (
        SELECT COALESCE(COUNT(*), 0)::INTEGER
        FROM feedback
        WHERE productid = p.id AND rating IS NOT NULL
    );

-- Step 5: Show final result
SELECT 'FINAL RESULT' as step;
SELECT 
    name,
    averagerating,
    totalratings,
    CASE 
        WHEN totalratings > 0 THEN '✅ HAS RATING'
        ELSE '❌ NO RATING'
    END as status
FROM products;

-- Step 6: Verify
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM products WHERE totalratings > 0)
        THEN '✅ SUCCESS - Products have ratings!'
        ELSE '❌ FAILED - Check if feedback.productid matches products.id'
    END as result;
