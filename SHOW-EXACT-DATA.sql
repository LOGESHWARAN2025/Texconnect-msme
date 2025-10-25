-- =====================================================
-- SHOW EXACT DATA - See everything
-- =====================================================

-- 1. Show EXACT feedback data
SELECT 
    '1. FEEDBACK TABLE' as section,
    id::text as feedback_id,
    username,
    rating,
    productid::text as productid,
    orderid::text as orderid,
    CASE 
        WHEN productid IS NULL THEN '❌ NULL'
        ELSE '✅ HAS VALUE'
    END as productid_status
FROM feedback;

-- 2. Show EXACT products data
SELECT 
    '2. PRODUCTS TABLE' as section,
    id::text as product_id,
    name,
    averagerating,
    totalratings
FROM products;

-- 3. Show the order to see what product was ordered
SELECT 
    '3. ORDER DATA' as section,
    id::text as order_id,
    items::text as items_json
FROM orders
WHERE id = '1de9ffc6-1705-49e7-ba4d-f83e917f315d';

-- 4. Extract productId from order
SELECT 
    '4. PRODUCT FROM ORDER' as section,
    (item->>'productId')::text as product_id_from_order,
    (item->>'productName')::text as product_name,
    (item->>'quantity')::text as quantity
FROM orders o,
jsonb_array_elements(o.items) as item
WHERE o.id = '1de9ffc6-1705-49e7-ba4d-f83e917f315d';

-- 5. Check if feedback.productid matches the product from order
SELECT 
    '5. COMPARISON' as section,
    f.productid::text as feedback_productid,
    (item->>'productId')::text as order_productid,
    CASE 
        WHEN f.productid::text = (item->>'productId')::text THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as match_status
FROM feedback f
CROSS JOIN orders o
CROSS JOIN jsonb_array_elements(o.items) as item
WHERE f.orderid = o.id
AND o.id = '1de9ffc6-1705-49e7-ba4d-f83e917f315d';

-- 6. If productid is NULL in feedback, update it now
UPDATE feedback f
SET productid = (
    SELECT (item->>'productId')::uuid
    FROM orders o,
    jsonb_array_elements(o.items) as item
    WHERE o.id = f.orderid
    LIMIT 1
)
WHERE f.orderid = '1de9ffc6-1705-49e7-ba4d-f83e917f315d'
AND f.productid IS NULL;

-- 7. Show feedback after update
SELECT 
    '7. FEEDBACK AFTER UPDATE' as section,
    id::text,
    username,
    rating,
    productid::text,
    CASE 
        WHEN productid IS NULL THEN '❌ STILL NULL'
        ELSE '✅ NOW HAS VALUE'
    END as status
FROM feedback;

-- 8. Now update the product rating
UPDATE products p
SET 
    averagerating = (
        SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
        FROM feedback
        WHERE productid = p.id AND rating IS NOT NULL
    ),
    totalratings = (
        SELECT COALESCE(COUNT(rating), 0)::INTEGER
        FROM feedback
        WHERE productid = p.id AND rating IS NOT NULL
    )
WHERE EXISTS (
    SELECT 1 FROM feedback WHERE productid = p.id AND rating IS NOT NULL
);

-- 9. Show final result
SELECT 
    '9. FINAL RESULT' as section,
    p.name,
    p.averagerating,
    p.totalratings,
    f.rating as feedback_rating,
    f.username as feedback_from
FROM products p
LEFT JOIN feedback f ON f.productid = p.id;

-- 10. Verification
SELECT 
    '10. SUCCESS CHECK' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM products WHERE totalratings > 0) 
        THEN '✅ SUCCESS! Product has rating now!'
        ELSE '❌ FAILED - productid might still be NULL'
    END as result;

-- Show what the rating means
SELECT 
    '11. RATING MEANING' as section,
    '1 star = ★☆☆☆☆' as display,
    'This is what you see in admin panel' as note;
