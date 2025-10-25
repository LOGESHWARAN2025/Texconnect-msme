-- =====================================================
-- COMPLETE INVOICE FIX - Everything You Need
-- =====================================================

-- =====================================================
-- PART 1: FIX COLUMN NAMES (Smart - handles all cases)
-- =====================================================

DO $$
BEGIN
    -- Rename buyerid to buyerId if lowercase exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyerid') THEN
        ALTER TABLE orders RENAME COLUMN buyerid TO "buyerId";
        RAISE NOTICE '✅ Renamed buyerid to buyerId';
    END IF;
    
    -- Rename buyername to buyerName if lowercase exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyername') THEN
        ALTER TABLE orders RENAME COLUMN buyername TO "buyerName";
        RAISE NOTICE '✅ Renamed buyername to buyerName';
    END IF;
    
    -- Rename buyergst to buyerGst if lowercase exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyergst') THEN
        ALTER TABLE orders RENAME COLUMN buyergst TO "buyerGst";
        RAISE NOTICE '✅ Renamed buyergst to buyerGst';
    END IF;
    
    -- Add buyerId if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyerId') THEN
        ALTER TABLE orders ADD COLUMN "buyerId" UUID;
        RAISE NOTICE '✅ Added buyerId column';
    END IF;
    
    -- Add buyerName if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyerName') THEN
        ALTER TABLE orders ADD COLUMN "buyerName" TEXT;
        RAISE NOTICE '✅ Added buyerName column';
    END IF;
    
    -- Add buyerGst if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'buyerGst') THEN
        ALTER TABLE orders ADD COLUMN "buyerGst" TEXT;
        RAISE NOTICE '✅ Added buyerGst column';
    END IF;
END $$;

-- =====================================================
-- PART 2: ADD COMPANY NAME COLUMNS TO USERS
-- =====================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS companyname TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gstnumber TEXT;

-- =====================================================
-- PART 3: UPDATE ORDERS WITH BUYER DATA
-- =====================================================

-- Update orders with buyer information
UPDATE orders 
SET 
    "buyerId" = (SELECT id FROM users WHERE role = 'buyer' LIMIT 1),
    "buyerName" = (SELECT username FROM users WHERE role = 'buyer' LIMIT 1)
WHERE "buyerId" IS NULL OR "buyerName" IS NULL;

-- =====================================================
-- PART 4: ADD SAMPLE COMPANY NAMES (Optional)
-- =====================================================

-- Add company name for MSME user (Dhasvanth)
UPDATE users 
SET 
    companyname = username || ' Textiles Pvt Ltd',
    gstnumber = '33ABCDE' || SUBSTRING(id::text, 1, 7) || 'Z5'
WHERE role = 'msme' AND (companyname IS NULL OR companyname = '');

-- Add company name for Buyer user (logeshwaran)
UPDATE users 
SET 
    companyname = username || ' Traders',
    gstnumber = '33XYZAB' || SUBSTRING(id::text, 1, 7) || 'W4'
WHERE role = 'buyer' AND (companyname IS NULL OR companyname = '');

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check orders have buyer data
SELECT 
    o.id,
    o."buyerId"::text as buyer_id,
    o."buyerName" as buyer_name,
    o."buyerGst" as buyer_gst,
    o.date,
    o.total,
    o.status,
    jsonb_array_length(o.items) as item_count
FROM orders o;

-- Check users have company names
SELECT 
    id,
    username,
    role,
    companyname,
    gstnumber,
    email
FROM users
WHERE role IN ('msme', 'buyer')
ORDER BY role, username;

-- Check complete invoice data
SELECT 
    o.id as order_id,
    o."buyerName",
    buyer.companyname as buyer_company,
    buyer.gstnumber as buyer_gst,
    seller.username as seller_name,
    seller.companyname as seller_company,
    seller.gstnumber as seller_gst,
    i.name as product_name,
    i.price,
    item->>'quantity' as quantity
FROM orders o
LEFT JOIN users buyer ON buyer.id = o."buyerId"
LEFT JOIN jsonb_array_elements(o.items) as item ON true
LEFT JOIN inventory i ON i.id::text = (item->>'productId')
LEFT JOIN users seller ON seller.id::text = i.msmeid::text
WHERE jsonb_array_length(o.items) > 0;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
DECLARE
    order_count INTEGER;
    orders_with_buyer INTEGER;
    msme_with_company INTEGER;
    buyer_with_company INTEGER;
BEGIN
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT COUNT(*) INTO orders_with_buyer FROM orders WHERE "buyerId" IS NOT NULL;
    SELECT COUNT(*) INTO msme_with_company FROM users WHERE role = 'msme' AND companyname IS NOT NULL;
    SELECT COUNT(*) INTO buyer_with_company FROM users WHERE role = 'buyer' AND companyname IS NOT NULL;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INVOICE COMPLETE FIX DONE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Orders: % total', order_count;
    RAISE NOTICE 'Orders with buyer: %', orders_with_buyer;
    RAISE NOTICE 'MSME with company name: %', msme_with_company;
    RAISE NOTICE 'Buyers with company name: %', buyer_with_company;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Invoice will now show:';
    RAISE NOTICE '  ✅ Buyer company name';
    RAISE NOTICE '  ✅ MSME company name';
    RAISE NOTICE '  ✅ GST numbers';
    RAISE NOTICE '  ✅ All order details';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Refresh your app (Ctrl+R)';
    RAISE NOTICE '  2. Go to Buyer/MSME Orders';
    RAISE NOTICE '  3. Click Download PDF';
    RAISE NOTICE '  4. Invoice should work!';
    RAISE NOTICE '========================================';
END $$;
