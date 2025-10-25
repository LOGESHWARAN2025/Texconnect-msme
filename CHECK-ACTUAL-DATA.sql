-- =====================================================
-- CHECK ACTUAL DATA IN DATABASE
-- =====================================================

-- 1. Show feedback table raw data
SELECT 
    'FEEDBACK TABLE' as table_name,
    id,
    username,
    rating,
    productid,
    orderid
FROM feedback;

-- 2. Show products table raw data
SELECT 
    'PRODUCTS TABLE' as table_name,
    id,
    name,
    averagerating,
    totalratings
FROM products;

-- 3. Check if productid in feedback is NULL
SELECT 
    'PRODUCTID CHECK' as check_name,
    CASE 
        WHEN productid IS NULL THEN '❌ productid is NULL - THIS IS THE PROBLEM!'
        ELSE '✅ productid has value: ' || productid::text
    END as result,
    rating,
    username
FROM feedback;

-- 4. If productid is NULL, get it from order
SELECT 
    'GET PRODUCTID FROM ORDER' as step,
    o.id as order_id,
    (item->>'productId') as product_id_from_order,
    (item->>'productName') as product_name
FROM orders o,
jsonb_array_elements(o.items) as item
WHERE o.id IN (SELECT orderid FROM feedback);

-- 5. MANUALLY set productid in feedback
DO $$
DECLARE
    feedback_rec RECORD;
    prod_id UUID;
BEGIN
    FOR feedback_rec IN SELECT id, orderid FROM feedback WHERE productid IS NULL LOOP
        -- Get productid from order
        SELECT (item->>'productId')::uuid INTO prod_id
        FROM orders o,
        jsonb_array_elements(o.items) as item
        WHERE o.id = feedback_rec.orderid
        LIMIT 1;
        
        -- Update feedback
        UPDATE feedback
        SET productid = prod_id
        WHERE id = feedback_rec.id;
        
        RAISE NOTICE 'Updated feedback % with productid %', feedback_rec.id, prod_id;
    END LOOP;
END $$;

-- 6. Check feedback again
SELECT 
    'FEEDBACK AFTER FIX' as status,
    id,
    username,
    rating,
    productid,
    CASE 
        WHEN productid IS NULL THEN '❌ STILL NULL'
        ELSE '✅ NOW HAS VALUE'
    END as status
FROM feedback;

-- 7. Now update products
DO $$
DECLARE
    prod_rec RECORD;
    avg_val DECIMAL(3,2);
    count_val INTEGER;
BEGIN
    FOR prod_rec IN SELECT id, name FROM products LOOP
        -- Calculate from feedback
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(3,2),
            COALESCE(COUNT(*), 0)::INTEGER
        INTO avg_val, count_val
        FROM feedback
        WHERE productid = prod_rec.id
        AND rating IS NOT NULL;
        
        -- Update product
        UPDATE products
        SET 
            averagerating = avg_val,
            totalratings = count_val
        WHERE id = prod_rec.id;
        
        RAISE NOTICE 'Product: % | Rating: % | Count: %', prod_rec.name, avg_val, count_val;
    END LOOP;
END $$;

-- 8. Show final result
SELECT 
    'FINAL RESULT' as status,
    name,
    averagerating,
    totalratings,
    CASE 
        WHEN totalratings > 0 THEN '✅ SUCCESS!'
        ELSE '❌ STILL ZERO'
    END as result
FROM products;

-- 9. Show what will display
SELECT 
    'DISPLAY IN BROWSE PRODUCTS' as status,
    name,
    CASE 
        WHEN totalratings = 0 THEN 'No ratings yet'
        ELSE '★ ' || averagerating || ' (' || totalratings || ')'
    END as display
FROM products;
