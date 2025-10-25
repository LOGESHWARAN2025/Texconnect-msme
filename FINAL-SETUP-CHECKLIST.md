# Final Setup Checklist - Orders & Inventory

## Current Status
✅ Orders are being saved to Supabase
✅ Buyer can see their orders
✅ Debugging logs added
❌ MSME cannot see orders (filtering issue)
❌ Inventory stock not updating

---

## Steps to Fix Everything

### 1. Run Database Setup (REQUIRED)
```sql
-- In Supabase SQL Editor
-- Run: COMPLETE-FIX-ALL.sql
```

This will:
- ✅ Create orders table with correct structure
- ✅ Add stock deduction trigger (for products AND inventory)
- ✅ Add RLS policies for all roles
- ✅ Enable realtime subscriptions

### 2. Restart Your Application
```bash
# Stop server (Ctrl+C)
npm run dev
```

### 3. Check Browser Console
Open browser (F12) → Console tab

**Expected logs when MSME views Orders:**
```javascript
📦 Raw products from database: [...]
📦 Mapped products: [...]
🏭 MSME Products: { userProducts: 3 }  ← Should be > 0
📋 OrdersView: { totalOrders: 5 }      ← Should be > 0
✅ Filtered MSME orders: 2             ← Should be > 0
```

### 4. Test Complete Flow

#### A. Create MSME Products
1. Login as MSME
2. Go to Products section
3. Add a product (e.g., "Cotton Fabric", Stock: 100)
4. Note the product name

#### B. Place Order as Buyer
1. Login as Buyer
2. Browse products
3. Find the MSME's product
4. Place order for 10 units
5. **Check:** Order appears in "My Orders" ✓

#### C. Accept Order as MSME
1. Login as MSME
2. Go to Orders menu
3. **Check:** Order should appear ✓
4. Change status to "Accepted"
5. **Check:** Stock decreases (100 → 90) ✓

#### D. Verify Updates
1. Login as Buyer
2. Go to "My Orders"
3. **Check:** Status shows "Accepted" ✓
4. Browse products
5. **Check:** Stock shows 90 ✓

---

## Common Issues & Solutions

### Issue 1: MSME Orders Menu Empty

**Symptoms:**
- Buyer sees orders ✓
- MSME sees "No orders found" ❌

**Diagnosis:**
Check browser console for:
```javascript
🏭 MSME Products: { userProducts: 0 }  ← Problem!
```

**Solutions:**

**A. MSME has no products**
- Go to Products section
- Add products
- Refresh Orders menu

**B. Orders don't contain MSME's products**
- Run diagnostic: `FIX-MSME-ORDERS-DISPLAY.sql`
- Place order for THIS MSME's products specifically

**C. Product ID mismatch**
- Check console logs for product IDs
- Verify order contains correct product IDs

### Issue 2: Inventory Stock Not Updating

**Symptoms:**
- Order accepted ✓
- Product stock decreases ✓
- Inventory stock stays same ❌

**Solution:**
1. Run `COMPLETE-FIX-ALL.sql` (uses lowercase `updatedat`)
2. Restart app
3. Accept order
4. Check Supabase logs for: `✅ Updated inventory stock`

### Issue 3: Stock Not Displaying in Buyer Portal

**Solution:**
1. Verify realtime is enabled
2. Refresh browser
3. Check RLS policies allow buyers to read products

---

## Diagnostic Scripts

### Check Orders Setup
```sql
-- Run: FIX-MSME-ORDERS-DISPLAY.sql
```
Shows:
- How many orders exist
- Which MSME owns which products
- Why orders aren't showing

### Check Inventory Stock
```sql
-- Run: TEST-INVENTORY-STOCK.sql
```
Tests:
- Creates test order with inventory item
- Accepts it
- Verifies stock decreased

### Check Trigger Status
```sql
-- Run: CHECK-TRIGGER-STATUS.sql
```
Verifies:
- Trigger is installed
- Function exists
- Database structure is correct

---

## Expected Behavior

### When Buyer Places Order:
1. Order created in Supabase ✓
2. Status: "Pending" ✓
3. Stock: UNCHANGED ✓
4. Visible in buyer's "My Orders" ✓
5. Visible in MSME's "Orders" menu ✓

### When MSME Accepts Order:
1. Status: "Pending" → "Accepted" ✓
2. Trigger fires automatically ✓
3. Stock decreases (products OR inventory) ✓
4. Buyer sees status update in real-time ✓
5. Buyer sees stock update in browse products ✓

### When MSME Ships Order:
1. Status: "Accepted" → "Shipped" ✓
2. Invoice available for download ✓

### When Order Delivered:
1. Status: "Shipped" → "Delivered" ✓
2. Buyer can provide feedback ✓

---

## Database Tables

### orders
- Stores all orders
- JSONB items array with productId
- Triggers on status change

### products
- Finished goods for sale
- Column: `msmeid` (lowercase)
- Stock decreases on order acceptance

### inventory
- Raw materials
- Column: `msmeid` (lowercase)
- Column: `updatedat` (lowercase)
- Stock decreases on order acceptance

---

## Quick Verification

### 1. Check Database
```sql
-- Orders exist?
SELECT COUNT(*) FROM orders;

-- Products exist?
SELECT COUNT(*) FROM products;

-- Trigger installed?
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'order_acceptance_stock_trigger';
```

### 2. Check Browser Console
```javascript
// Products fetched?
📦 Raw products from database: [...]

// Orders fetched?
✅ Orders fetched: 5 orders

// Filtering working?
✅ Filtered MSME orders: 2
```

### 3. Check Supabase Logs
When order is accepted:
```
🔄 Order accepted, processing stock deduction...
✅ Updated product stock. New stock: 90
```

---

## Final Checklist

- [ ] Run `COMPLETE-FIX-ALL.sql` in Supabase
- [ ] Restart application (`npm run dev`)
- [ ] MSME creates products
- [ ] Buyer places order
- [ ] Order appears in buyer's "My Orders" ✓
- [ ] Order appears in MSME's "Orders" menu ✓
- [ ] MSME accepts order
- [ ] Stock decreases ✓
- [ ] Buyer sees status update ✓
- [ ] Buyer sees stock update ✓

---

## If Still Not Working

1. **Run diagnostic:** `FIX-MSME-ORDERS-DISPLAY.sql`
2. **Check console:** Share the logs
3. **Check Supabase logs:** Look for trigger messages
4. **Verify RLS policies:** Ensure they're correct

---

## Summary

**The system is designed to:**
1. ✅ Store orders in Supabase
2. ✅ Show orders to buyers (their own)
3. ✅ Show orders to MSMEs (for their products)
4. ✅ Automatically decrease stock on acceptance
5. ✅ Update in real-time for all users

**The issue is:**
- MSME orders filtering logic needs correct product ownership matching
- Check browser console logs to see the exact issue

**Run `COMPLETE-FIX-ALL.sql` and check the console logs!**
