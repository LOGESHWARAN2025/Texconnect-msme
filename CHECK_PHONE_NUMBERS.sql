-- Check if users have phone numbers
SELECT id, username, displayname, phone, role
FROM users
WHERE role IN ('buyer', 'msme')
LIMIT 10;

-- Check a specific order's buyer phone
SELECT 
    o.id as order_id,
    o.buyerId,
    o.status,
    u.username,
    u.displayname,
    u.phone as buyer_phone
FROM orders o
JOIN users u ON o.buyerId = u.id
WHERE o.id = 'YOUR_ORDER_ID_HERE'
LIMIT 1;
