-- =====================================================
-- FIX STOCK DEDUCTION ON ORDER ACCEPTANCE
-- =====================================================
-- This creates a trigger to automatically decrease stock
-- when MSME changes order status from Pending to Accepted
-- =====================================================

-- Step 1: Remove stock deduction from placeOrder
-- (This will be done in code - see instructions below)

-- Step 2: Create function to handle stock deduction on acceptance
CREATE OR REPLACE FUNCTION handle_order_acceptance()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_id UUID;
    order_quantity INTEGER;
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Only process when status changes from Pending to Accepted
    IF NEW.status = 'Accepted' AND OLD.status = 'Pending' THEN
        
        RAISE NOTICE '🔄 Order accepted, processing stock deduction...';
        RAISE NOTICE 'Order ID: %', NEW.id;
        
        -- Loop through all items in the order
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            -- Extract product details from JSONB
            product_id := (item.value->>'productId')::UUID;
            order_quantity := (item.value->>'quantity')::INTEGER;
            
            RAISE NOTICE 'Processing item: Product ID = %, Quantity = %', product_id, order_quantity;
            
            -- Try to update products table first
            UPDATE products
            SET 
                stock = stock - order_quantity,
                "updatedAt" = NOW()
            WHERE id = product_id
            RETURNING stock INTO new_stock;
            
            IF FOUND THEN
                RAISE NOTICE '✅ Updated product stock. New stock: %', new_stock;
                
                -- Check if stock went negative (shouldn't happen with proper validation)
                IF new_stock < 0 THEN
                    RAISE WARNING '⚠️ Product % stock is negative: %', product_id, new_stock;
                END IF;
            ELSE
                -- If not in products, try inventory table
                UPDATE inventory
                SET 
                    stock = stock - order_quantity,
                    "updatedAt" = NOW()
                WHERE id = product_id
                RETURNING stock INTO new_stock;
                
                IF FOUND THEN
                    RAISE NOTICE '✅ Updated inventory stock. New stock: %', new_stock;
                    
                    IF new_stock < 0 THEN
                        RAISE WARNING '⚠️ Inventory item % stock is negative: %', product_id, new_stock;
                    END IF;
                ELSE
                    RAISE WARNING '❌ Product/Inventory item % not found!', product_id;
                END IF;
            END IF;
        END LOOP;
        
        RAISE NOTICE '✅ Stock deduction complete for order %', NEW.id;
    END IF;
    
    -- If order is cancelled, restore stock
    IF NEW.status = 'Cancelled' AND OLD.status IN ('Pending', 'Accepted') THEN
        
        RAISE NOTICE '🔄 Order cancelled, restoring stock...';
        
        -- Only restore if it was previously accepted (stock was deducted)
        IF OLD.status = 'Accepted' THEN
            FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                product_id := (item.value->>'productId')::UUID;
                order_quantity := (item.value->>'quantity')::INTEGER;
                
                -- Try products table
                UPDATE products
                SET 
                    stock = stock + order_quantity,
                    "updatedAt" = NOW()
                WHERE id = product_id;
                
                IF NOT FOUND THEN
                    -- Try inventory table
                    UPDATE inventory
                    SET 
                        stock = stock + order_quantity,
                        "updatedAt" = NOW()
                    WHERE id = product_id;
                END IF;
                
                RAISE NOTICE '✅ Restored stock for product %', product_id;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS order_acceptance_stock_trigger ON orders;

-- Step 4: Create trigger
CREATE TRIGGER order_acceptance_stock_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_order_acceptance();

-- Step 5: Verify trigger was created
SELECT 'VERIFICATION' as step;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'orders'
AND trigger_name = 'order_acceptance_stock_trigger';

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ STOCK DEDUCTION TRIGGER CREATED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'How it works:';
    RAISE NOTICE '  1. Buyer places order → Stock NOT deducted';
    RAISE NOTICE '  2. MSME accepts order → Stock AUTOMATICALLY deducted';
    RAISE NOTICE '  3. MSME cancels accepted order → Stock RESTORED';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update placeOrder() to NOT deduct stock';
    RAISE NOTICE '  2. Test: Place order → Stock unchanged';
    RAISE NOTICE '  3. Test: Accept order → Stock decreases';
    RAISE NOTICE '  4. Test: Cancel accepted order → Stock restored';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'IMPORTANT: You must also update the code!';
    RAISE NOTICE 'See: FIX-STOCK-GUIDE.md for instructions';
    RAISE NOTICE '========================================';
END $$;
