# TexConnect MSME Platform

A comprehensive B2B textile marketplace connecting MSMEs (Micro, Small & Medium Enterprises) with buyers, featuring real-time order management, inventory tracking, and automated stock management.

## 🚀 Features

### For MSMEs
- **Product & Inventory Management** - Manage products and raw materials inventory
- **Order Management** - View and process orders with status tracking
- **Automatic Stock Deduction** - Stock automatically decreases when orders are accepted
- **Real-time Updates** - See order changes instantly
- **Dashboard Analytics** - Track sales, revenue, and stock levels
- **Issue Reporting** - Report and track issues with orders

### For Buyers
- **Product Browsing** - Browse products by domain with search and filters
- **Real-time Stock Display** - See updated stock levels instantly
- **Order Placement** - Place orders with quantity selection
- **Order Tracking** - Track order status in real-time
- **Feedback System** - Provide ratings and feedback on delivered orders
- **Issue Reporting** - Report issues with orders

### For Admins
- **User Management** - Approve/reject MSME and buyer registrations
- **Order Oversight** - View and manage all orders
- **Audit Logs** - Track all admin actions
- **Issue Resolution** - Manage and resolve reported issues

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Supabase Account** - For database and authentication

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd texconnect-msme
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
API_KEY=your_gemini_api_key
```

### 4. Set Up Database

**Important:** Run this SQL script in Supabase SQL Editor to set up the complete database:

```sql
-- Run: COMPLETE-FIX-ALL.sql
```

This script will:
- ✅ Create orders table with correct structure
- ✅ Add automatic `updatedAt` trigger
- ✅ Add stock deduction trigger (decreases stock when order accepted)
- ✅ Create RLS policies for all user roles
- ✅ Enable realtime subscriptions
- ✅ Add performance indexes

### 5. Run the Application
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🔧 Database Setup

### Required SQL Scripts

Run these scripts in order in your Supabase SQL Editor:

1. **`COMPLETE-FIX-ALL.sql`** - Complete database setup (REQUIRED)
   - Orders table with triggers
   - Stock management automation
   - RLS policies
   - Realtime subscriptions

### Optional Diagnostic Scripts

- **`DEBUG-MSME-ORDERS.sql`** - Check if orders are properly configured
- **`DIAGNOSE-ISSUES.sql`** - Diagnose any database issues
- **`VERIFY-ORDERS-SETUP.sql`** - Verify orders table setup
- **`VERIFY-STOCK-TRIGGER.sql`** - Verify stock trigger installation

## 📊 How It Works

### Order & Stock Management Flow

```
┌─────────────────────────────────────────────┐
│ 1. Buyer Places Order                       │
│    - Status: Pending                        │
│    - Stock: UNCHANGED                       │
│    - Visible to: Buyer ✓, MSME ✓          │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. MSME Accepts Order                       │
│    - Status: Pending → Accepted             │
│    - Stock: AUTOMATICALLY DECREASED         │
│    - Trigger: Fires in database             │
│    - Realtime: Buyer notified               │
│    - Display: Updated in buyer portal       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. MSME Ships Order                         │
│    - Status: Accepted → Shipped             │
│    - Invoice: Available for download        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. Order Delivered                          │
│    - Status: Shipped → Delivered            │
│    - Buyer: Can provide feedback            │
└─────────────────────────────────────────────┘
```

### Stock Management

**Products Table (Finished Goods):**
- Managed in "Products" section
- Buyers can browse and order these
- Stock decreases when MSME accepts order
- Stock restores if accepted order is cancelled
- Updates visible in real-time to buyers

**Inventory Table (Raw Materials):**
- Managed in "Manage Inventory" section
- Can also be ordered by buyers (if needed)
- Same automatic stock management as products
- Stock decreases when orders are accepted
- Displayed in MSME dashboard with low stock alerts
- Updates in real-time

**How It Works:**
1. Buyer places order → Stock unchanged
2. MSME accepts order → Trigger fires automatically
3. Trigger checks: Is it in `products`? → Decrease stock
4. If not found: Is it in `inventory`? → Decrease stock
5. Stock update visible immediately to all users

## 🧪 Testing

### Test the Complete Flow

1. **Create MSME User**
   - Register as MSME
   - Admin approves registration
   - Login as MSME

2. **Add Products**
   - Go to Products section
   - Add a product (e.g., "Cotton Fabric", Stock: 100)
   - Note the product ID

3. **Place Order (as Buyer)**
   - Register/Login as Buyer
   - Browse products
   - Order 10 units of the product
   - **Verify:** Stock still shows 100

4. **Accept Order (as MSME)**
   - Login as MSME
   - Go to Orders menu
   - **Verify:** Order appears in list
   - Change status to "Accepted"
   - **Verify:** Stock decreases to 90

5. **Check Buyer Portal**
   - Login as Buyer
   - Go to "My Orders"
   - **Verify:** Status shows "Accepted"
   - Browse products
   - **Verify:** Stock shows 90

## 🐛 Troubleshooting

### Orders Not Showing in MSME Dashboard

**Check:**
1. Run `DEBUG-MSME-ORDERS.sql` in Supabase
2. Open browser console (F12) and look for logs:
   ```javascript
   🏭 MSME Products: { userProducts: 3 }
   📋 OrdersView - Filtering orders: { totalOrders: 5 }
   ✅ Filtered MSME orders: 2
   ```
3. Verify MSME owns products that are in orders

**Solution:**
- Ensure `COMPLETE-FIX-ALL.sql` was run
- Verify orders contain products owned by the MSME
- Check RLS policies are correct

### Stock Not Decreasing

**Check:**
1. Run `VERIFY-STOCK-TRIGGER.sql`
2. Check Supabase logs for trigger messages:
   ```
   🔄 Order accepted, processing stock deduction...
   ✅ Updated product stock. New stock: 90
   ```

**Solution:**
- Re-run `COMPLETE-FIX-ALL.sql`
- Verify order status changed to "Accepted"
- Check browser console for errors

### Stock Not Displaying in Buyer Portal

**Check:**
1. Browser console for realtime subscription
2. Verify products table has updated stock
3. Clear browser cache

**Solution:**
- Refresh the page
- Check realtime is enabled in Supabase
- Verify RLS policies allow buyers to read products

## 📁 Project Structure

```
texconnect-msme/
├── components/
│   ├── admin/          # Admin components
│   ├── buyer/          # Buyer components
│   ├── msme/           # MSME components
│   ├── common/         # Shared components
│   ├── feedback/       # Feedback system
│   └── invoice/        # Invoice generation
├── context/
│   └── SupabaseContext.tsx  # Global state & data fetching
├── services/
│   ├── dashboardService.ts  # Dashboard analytics
│   └── inventoryService.ts  # Inventory operations
├── SQL Scripts/
│   ├── COMPLETE-FIX-ALL.sql      # Main setup script
│   ├── DEBUG-MSME-ORDERS.sql     # Diagnostic tool
│   └── DIAGNOSE-ISSUES.sql       # Issue checker
└── README.md
```

## 🔑 Key Technologies

- **React** - Frontend framework
- **TypeScript** - Type safety
- **Supabase** - Backend (Database, Auth, Realtime)
- **TailwindCSS** - Styling
- **Recharts** - Analytics charts
- **Google Gemini AI** - Smart product descriptions

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Access** - Admin, MSME, Buyer roles
- **Email Verification** - Required for all users
- **Admin Approval** - MSMEs and Buyers require approval
- **Audit Logging** - Track all admin actions

## 📝 Database Triggers

### 1. Auto-Update Timestamp
Automatically updates `updatedAt` field on any order change.

### 2. Stock Deduction on Acceptance
```sql
-- When order status: Pending → Accepted
FOR each item in order:
    - Decrease product/inventory stock
    - Update timestamp
    - Log action

-- When order status: Accepted → Cancelled
FOR each item in order:
    - Restore product/inventory stock
    - Update timestamp
```

## 🚀 Deployment

### Deploy to Production

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Deploy to hosting:**
   - Vercel
   - Netlify
   - Any static hosting

3. **Configure Supabase:**
   - Set production URL in environment variables
   - Run `COMPLETE-FIX-ALL.sql` in production database
   - Enable realtime for orders table

## 📞 Support

If you encounter issues:

1. **Check browser console** (F12) for error messages
2. **Run diagnostic scripts** in Supabase SQL Editor
3. **Verify database setup** - Ensure `COMPLETE-FIX-ALL.sql` was run
4. **Check Supabase logs** for trigger execution

## 🎯 Quick Start Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Configure `.env` file
- [ ] Run `COMPLETE-FIX-ALL.sql` in Supabase
- [ ] Start dev server (`npm run dev`)
- [ ] Create test MSME user
- [ ] Add test product
- [ ] Create test buyer user
- [ ] Place test order
- [ ] Accept order as MSME
- [ ] Verify stock decreased
- [ ] Verify buyer sees update

## 📄 License

This project is part of the TexConnect MSME platform.

---

**Built with ❤️ for the Textile Industry**
