# TexConnect MSME Platform

> A comprehensive B2B marketplace platform connecting Micro, Small, and Medium Enterprises (MSMEs) with buyers through a secure, scalable, and real-time digital ecosystem.

[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [User Roles](#user-roles)
- [Core Modules](#core-modules)
- [Security](#security)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

TexConnect MSME Platform is a modern web application designed to bridge the gap between MSMEs and buyers by providing a unified marketplace with comprehensive features including product management, order processing, real-time inventory tracking, feedback systems, and issue resolution mechanisms.

### Problem Statement

MSMEs face challenges in:
- Reaching wider buyer networks
- Managing inventory efficiently
- Processing orders systematically
- Handling customer feedback
- Resolving business issues promptly

### Solution

A centralized platform that:
- Connects MSMEs directly with buyers
- Provides real-time inventory management
- Automates order processing
- Enables structured feedback collection
- Facilitates issue tracking and resolution

---

## ✨ Key Features

### For MSMEs
- **Product Management**: Add, edit, and manage product catalogs
- **Inventory Tracking**: Real-time stock monitoring with visual progress indicators
- **Order Management**: View and process incoming orders
- **Issue Reporting**: Report and track business issues
- **Analytics Dashboard**: Monitor business performance

### For Buyers
- **Product Discovery**: Browse products across multiple MSMEs
- **Smart Ordering**: Place orders with real-time stock validation
- **Order Tracking**: Monitor order status in real-time
- **Feedback System**: Rate and review products (1-5 stars)
- **Issue Resolution**: Report and track issues with orders

### For Administrators
- **User Management**: Approve and manage MSME and buyer accounts
- **Order Oversight**: Monitor all platform transactions
- **Feedback Analytics**: View and respond to user feedback
- **Issue Management**: Track, respond to, and resolve reported issues
- **Audit Logging**: Complete activity tracking for compliance
- **System Analytics**: Platform-wide performance metrics

---

## 🛠️ Technology Stack

### Frontend
- **React 18.x**: Modern UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Context API**: State management

### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Authentication & Authorization

### Additional Libraries
- **html2canvas**: Invoice generation
- **jsPDF**: PDF export functionality
- **Lucide React**: Modern icon library

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Admin   │  │   MSME   │  │  Buyer   │             │
│  │Dashboard │  │Dashboard │  │Dashboard │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Application Layer (React)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Context API (State Management)                  │  │
│  │  - Authentication  - Products  - Orders          │  │
│  │  - Inventory      - Feedback   - Issues          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │PostgreSQL│  │Real-time │  │   Auth   │             │
│  │ Database │  │Subscript.│  │  System  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Database Schema

**Core Tables:**
- `users`: User accounts (Admin, MSME, Buyer)
- `products`: Product catalog
- `orders`: Order transactions
- `inventory`: Stock management (deprecated, merged with products)
- `feedback`: User feedback and ratings
- `issues`: Issue tracking system
- `auditlogs`: System activity logs

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js >= 18.x
npm >= 9.x
Supabase account
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd texconnect-msme
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Run SQL scripts in Supabase SQL Editor (in order):
   ```
   1. supabase-schema.sql
   2. RECREATE-FEEDBACK-TABLE.sql
   3. RECREATE-ISSUES-TABLE.sql
   4. ADD-PRODUCT-RATINGS.sql
   5. ENABLE-REALTIME-UPDATES.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   ```
   http://localhost:5173
   ```

---

## 💾 Database Setup

### Required SQL Scripts

| Script | Purpose | Order |
|--------|---------|-------|
| `supabase-schema.sql` | Core database schema | 1 |
| `RECREATE-FEEDBACK-TABLE.sql` | Feedback system with ratings | 2 |
| `RECREATE-ISSUES-TABLE.sql` | Issue tracking system | 3 |
| `ADD-PRODUCT-RATINGS.sql` | Product rating calculations | 4 |
| `ENABLE-REALTIME-UPDATES.sql` | Real-time subscriptions | 5 |

### Database Features

- **Row Level Security (RLS)**: Ensures users only access authorized data
- **Triggers**: Automatic timestamp updates and rating calculations
- **Indexes**: Optimized queries for performance
- **Foreign Keys**: Maintains data integrity
- **Real-time**: Live updates across all clients

---

## 👥 User Roles

### Administrator
**Capabilities:**
- User management (approve/reject registrations)
- Platform oversight
- Feedback management
- Issue resolution
- Audit log access
- System analytics

**Access Level:** Full platform access

### MSME (Seller)
**Capabilities:**
- Product catalog management
- Inventory tracking
- Order processing
- Issue reporting
- Performance analytics

**Access Level:** Own products and orders

### Buyer
**Capabilities:**
- Product browsing
- Order placement
- Order tracking
- Feedback submission
- Issue reporting

**Access Level:** Own orders and feedback

---

## 📦 Core Modules

### 1. Authentication Module
- Email/password authentication
- Email verification
- Role-based access control
- Session management
- Secure logout

### 2. Product Management
- CRUD operations
- Image support (future)
- Category management
- Stock tracking
- Price management

### 3. Order Processing
- Real-time stock validation
- Order creation
- Status tracking (Pending → Accepted → Shipped → Delivered)
- Invoice generation
- Order history

### 4. Inventory Management
- Real-time stock levels
- Visual progress indicators
- Low stock alerts
- Automatic updates on orders

### 5. Feedback System
- 5-star rating system
- Category-based feedback
- Admin responses
- Automatic product rating calculation
- Real-time updates

### 6. Issue Tracking
- Multi-category issues (Order, Payment, Quality, Delivery, Technical)
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Open → In Progress → Resolved)
- Admin responses
- Resolution tracking

### 7. Analytics & Reporting
- User statistics
- Order analytics
- Feedback insights
- Issue metrics
- Audit logs

---

## 🔒 Security

### Implemented Security Measures

1. **Authentication**
   - Supabase Auth with email verification
   - Secure password hashing
   - Session management

2. **Authorization**
   - Row Level Security (RLS) policies
   - Role-based access control
   - API key protection

3. **Data Protection**
   - Input validation
   - SQL injection prevention (Supabase)
   - XSS protection (React)

4. **Audit Trail**
   - Complete activity logging
   - Timestamp tracking
   - User action recording

---

## 🎨 UI/UX Features

- **Responsive Design**: Mobile, tablet, and desktop support
- **Real-time Updates**: Live data synchronization
- **Intuitive Navigation**: Role-based dashboards
- **Visual Feedback**: Progress bars, status indicators
- **Multi-language Support**: i18n ready
- **Accessibility**: Semantic HTML, ARIA labels

---

## 📈 Future Enhancements

### Phase 1 (Testing & Quality)
- [ ] Unit testing (Jest/Vitest)
- [ ] Integration testing
- [ ] E2E testing (Playwright/Cypress)
- [ ] Performance testing
- [ ] Load testing

### Phase 2 (Performance)
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Image optimization
- [ ] Caching strategies
- [ ] CDN integration

### Phase 3 (Monitoring)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] User analytics (Google Analytics)
- [ ] Logging infrastructure

### Phase 4 (Features)
- [ ] Payment gateway integration
- [ ] Advanced search and filters
- [ ] Product recommendations
- [ ] Chat system
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] SMS alerts

### Phase 5 (DevOps)
- [ ] CI/CD pipeline
- [ ] Automated deployments
- [ ] Staging environment
- [ ] Backup strategy
- [ ] Disaster recovery

---

## 📊 Project Status

### Current Phase: **MVP Complete**

**Completed:**
- ✅ Core functionality
- ✅ User authentication
- ✅ Product management
- ✅ Order processing
- ✅ Feedback system
- ✅ Issue tracking
- ✅ Real-time updates
- ✅ Admin dashboard

**In Development:**
- 🔄 Testing infrastructure
- 🔄 Performance optimization
- 🔄 Production deployment

---

## 🤝 Contributing

This is an academic/demonstration project. For production use, additional work is required on:
- Comprehensive testing
- Security hardening
- Performance optimization
- Monitoring and logging
- Scalability infrastructure

---

## 📄 License

[Specify your license here]

---

## 👨‍💻 Developer

**Project Type:** B2B Marketplace Platform  
**Development Status:** MVP/Prototype  
**Target Deployment:** Production (with enhancements)

---

## 🔧 Troubleshooting & Common Fixes

### Product Not Showing After Add

**Symptoms:** Product saves but doesn't appear in list

**Fix:**
```sql
-- Run QUICK-FIX-PRODUCTS.sql in Supabase SQL Editor
-- This fixes RLS policies and approves MSME users
```

**Check:**
1. Open browser console (F12)
2. Look for: "✅ Product added successfully"
3. Look for: "✅ Products fetched: X products"

### Invoice Generation

**Feature:** Buyers can download A4 format invoices

**How to use:**
1. Place an order as buyer
2. Go to Orders page
3. Click "Download PDF" button
4. Print or save invoice

**Invoice includes:**
- Company details (buyer & seller)
- Product items with quantities
- GST calculation (18%)
- Amount in words
- Terms & conditions

### Profile Picture Upload

**Setup Required:**

1. Create storage buckets in Supabase:
   - `profile-pictures` (public)
   - `gst-certificates` (public)

2. Add storage policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload profile pictures"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow public to view
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'profile-pictures');
```

### Delete Pending Orders

**Feature:** Buyers can delete orders with "Pending" status

**How it works:**
1. Go to My Orders
2. Find pending order
3. Click "🗑️ Delete" button
4. Confirm deletion
5. Order removed from database

**Note:** Only PENDING orders can be deleted

### Real-time Updates Not Working

**Fix:**
```sql
-- Enable realtime on required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.issues;
```

### User Not Approved Error

**Symptoms:** "Unauthorized" error when adding products

**Fix:**
```sql
-- Approve all MSME users
UPDATE public.users 
SET isapproved = true 
WHERE role = 'msme';
```

### Tamil Translation

**Current Status:**
- ✅ Static text (menus, buttons) - Working
- ⚠️ Dynamic data (names, products) - Requires DB changes

**For full Tamil support:**
1. Add Tamil columns to tables
2. Update forms for bilingual input
3. Update context to fetch Tamil data

**See:** `FREE-TAMIL-TRANSLATION-GUIDE.md` for details

---

## 📁 Important SQL Scripts

### Setup Scripts (Run in order)
1. `supabase-schema.sql` - Core database schema
2. `RECREATE-FEEDBACK-TABLE.sql` - Feedback system
3. `RECREATE-ISSUES-TABLE.sql` - Issue tracking
4. `ADD-PRODUCT-RATINGS.sql` - Product ratings
5. `ENABLE-REALTIME-UPDATES.sql` - Real-time subscriptions

### Fix Scripts (Run when needed)
- `QUICK-FIX-PRODUCTS.sql` - Fix product add/display issues
- `FIX-PRODUCTS-RLS.sql` - Complete RLS policy fix
- `DIAGNOSE-PRODUCTS.sql` - Diagnostic queries
- `SYNC-INVENTORY-WITH-PRODUCTS.sql` - Sync inventory
- `FIX-STATUS-UPDATE-COMPLETE.sql` - Fix order status

### Verification Scripts
- `CHECK-INVENTORY-COLUMNS.sql` - Verify inventory schema
- `CHECK-FEEDBACK-AND-RATINGS.sql` - Check feedback system
- `CHECK-STOCK-DECREASE.sql` - Verify stock updates
- `VERIFY-AND-FIX-ALL.sql` - Complete system check

---

## 📞 Support

### Quick Diagnostics

1. **Check Browser Console** (F12)
   - Look for error messages
   - Check network tab for failed requests

2. **Verify Database**
   ```sql
   -- Check user status
   SELECT id, email, role, isapproved FROM public.users WHERE role = 'msme';
   
   -- Check products
   SELECT * FROM public.products ORDER BY createdat DESC LIMIT 5;
   
   -- Check RLS policies
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'products';
   ```

3. **Common Issues**
   - Products not showing → Run `QUICK-FIX-PRODUCTS.sql`
   - User not approved → Run approval SQL
   - Realtime not working → Enable realtime publication
   - Upload failing → Check storage policies

### Getting Help

For questions or issues:
1. Check SQL scripts in project root
2. Review browser console logs (F12)
3. Verify Supabase configuration
4. Run diagnostic scripts
5. Check RLS policies

---

## ✅ Recent Fixes & Updates

### Product Management
- ✅ Fixed product add not showing in list
- ✅ Fixed field name mismatches (msmeId vs msmeid)
- ✅ Added auto-refresh after add/update/delete
- ✅ Enhanced error logging

### Profile Features
- ✅ Profile picture upload (MSME & Buyer)
- ✅ GST certificate upload (PDF/JPEG)
- ✅ Removed default avatars (pravatar.cc)
- ✅ Clean fallback icons

### Invoice System
- ✅ A4 format invoice generation
- ✅ Print functionality
- ✅ PDF download
- ✅ Amount in words (Indian numbering)
- ✅ GST calculation (18%)
- ✅ Terms & conditions

### Order Management
- ✅ Delete pending orders feature
- ✅ Real-time order updates
- ✅ Status tracking
- ✅ Invoice generation

### Database
- ✅ Fixed inventory sync
- ✅ Fixed column name errors
- ✅ Optimized RLS policies
- ✅ Real-time enabled on all tables

---

**Built with ❤️ using React, TypeScript, and Supabase**
