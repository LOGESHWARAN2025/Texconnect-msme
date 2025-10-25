-- =====================================================
-- TEXCONNECT MSME SUPABASE DATABASE SCHEMA
-- =====================================================
-- This schema creates all necessary tables for the TexConnect MSME platform
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  displayName TEXT,
  firstname TEXT,
  lastname TEXT,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'msme', 'buyer')),
  
  -- MSME specific fields
  domain TEXT,
  gstNumber TEXT,
  gstCertificateUrl TEXT,
  
  -- Profile
  profilePicture TEXT,
  profilePictureUrl TEXT,
  
  -- Status fields
  isApproved BOOLEAN DEFAULT false,
  isEmailVerified BOOLEAN DEFAULT false,
  
  -- Pending changes (for profile update requests)
  pendingChanges JSONB,
  
  -- Timestamps
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_username_key UNIQUE (username)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_isApproved ON users(isApproved);

-- =====================================================
-- 2. INVENTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msmeId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Item details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pieces',
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'out_of_stock')),
  
  -- Images
  imageUrl TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inventory_msmeId ON inventory(msmeId);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- =====================================================
-- 3. PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  msmeId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Product details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  initialStock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pieces',
  
  -- Product specifications
  specifications JSONB,
  
  -- Images
  imageUrl TEXT,
  images TEXT[],
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  
  -- Timestamps
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_msmeId ON products(msmeId);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =====================================================
-- 4. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyerId UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Order details
  itemId UUID,
  itemName TEXT NOT NULL,
  itemType TEXT CHECK (itemType IN ('inventory', 'product')),
  quantity INTEGER NOT NULL,
  totalPrice DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  
  -- Delivery details
  deliveryAddress TEXT,
  deliveryDate TIMESTAMP WITH TIME ZONE,
  
  -- Payment
  paymentStatus TEXT DEFAULT 'pending' CHECK (paymentStatus IN ('pending', 'paid', 'failed', 'refunded')),
  paymentMethod TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyerId ON orders(buyerId);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt ON orders(createdAt DESC);

-- =====================================================
-- 5. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auditLogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID REFERENCES users(id) ON DELETE SET NULL,
  username TEXT,
  
  -- Action details
  action TEXT NOT NULL,
  details TEXT,
  
  -- Metadata
  ipAddress TEXT,
  userAgent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auditLogs_userId ON auditLogs(userId);
CREATE INDEX IF NOT EXISTS idx_auditLogs_timestamp ON auditLogs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_auditLogs_action ON auditLogs(action);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditLogs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all users
CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow user creation during signup
CREATE POLICY "Enable insert for authentication"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- INVENTORY TABLE POLICIES
-- =====================================================

-- MSMEs can view their own inventory
CREATE POLICY "MSMEs can view own inventory"
  ON inventory FOR SELECT
  USING (msmeId = auth.uid());

-- MSMEs can insert their own inventory
CREATE POLICY "MSMEs can insert own inventory"
  ON inventory FOR INSERT
  WITH CHECK (msmeId = auth.uid());

-- MSMEs can update their own inventory
CREATE POLICY "MSMEs can update own inventory"
  ON inventory FOR UPDATE
  USING (msmeId = auth.uid());

-- MSMEs can delete their own inventory
CREATE POLICY "MSMEs can delete own inventory"
  ON inventory FOR DELETE
  USING (msmeId = auth.uid());

-- Buyers can view active inventory
CREATE POLICY "Buyers can view active inventory"
  ON inventory FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

-- Admins can view all inventory
CREATE POLICY "Admins can view all inventory"
  ON inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- MSMEs can manage their own products
CREATE POLICY "MSMEs can view own products"
  ON products FOR SELECT
  USING (msmeId = auth.uid());

CREATE POLICY "MSMEs can insert own products"
  ON products FOR INSERT
  WITH CHECK (msmeId = auth.uid());

CREATE POLICY "MSMEs can update own products"
  ON products FOR UPDATE
  USING (msmeId = auth.uid());

CREATE POLICY "MSMEs can delete own products"
  ON products FOR DELETE
  USING (msmeId = auth.uid());

-- Buyers can view active products
CREATE POLICY "Buyers can view active products"
  ON products FOR SELECT
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'buyer'
    )
  );

-- Admins can view all products
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Buyers can view their own orders
CREATE POLICY "Buyers can view own orders"
  ON orders FOR SELECT
  USING (buyerId = auth.uid());

-- Buyers can create orders
CREATE POLICY "Buyers can create orders"
  ON orders FOR INSERT
  WITH CHECK (buyerId = auth.uid());

-- Buyers can update their own orders
CREATE POLICY "Buyers can update own orders"
  ON orders FOR UPDATE
  USING (buyerId = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON auditLogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON auditLogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete audit logs
CREATE POLICY "Admins can delete audit logs"
  ON auditLogs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedAt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updatedAt
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (OPTIONAL)
-- =====================================================

-- You can add initial admin user here if needed
-- Note: You'll need to create the auth user first, then insert into users table

-- =====================================================
-- STORAGE BUCKETS (for file uploads)
-- =====================================================

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for GST certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('gst-certificates', 'gst-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile pictures
CREATE POLICY "Public profile pictures are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile picture"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-pictures' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for GST certificates
CREATE POLICY "Users can view their own GST certificate"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gst-certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all GST certificates"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'gst-certificates' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can upload their own GST certificate"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'gst-certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for product images
CREATE POLICY "Product images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "MSMEs can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'msme'
    )
  );

CREATE POLICY "MSMEs can update their product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'msme'
    )
  );

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
-- Schema creation complete!
-- Next steps:
-- 1. Run this SQL in your Supabase SQL Editor
-- 2. Verify all tables are created
-- 3. Test the RLS policies
-- 4. Create your first admin user through the auth system
-- =====================================================
