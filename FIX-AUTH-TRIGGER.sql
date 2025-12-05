-- =====================================================
-- FIX AUTH TRIGGER FOR USER CREATION
-- =====================================================
-- This trigger automatically creates a user profile when a new user signs up
-- Run this in Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    username,
    firstname,
    phone,
    address,
    role,
    gstNumber,
    isApproved,
    isEmailVerified,
    createdAt,
    updatedAt
  ) VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'firstname', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'buyer'),
    COALESCE(new.raw_user_meta_data->>'gstnumber', ''),
    CASE WHEN COALESCE(new.raw_user_meta_data->>'role', 'buyer') = 'admin' THEN true ELSE false END,
    false,
    NOW(),
    NOW()
  );
  RETURN new;
EXCEPTION WHEN unique_violation THEN
  -- If user already exists, just return
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VERIFY TRIGGER
-- =====================================================
-- Run this to check if trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- TEST TRIGGER (Optional)
-- =====================================================
-- You can test by creating a test user in Supabase Auth
-- Then check if the profile was created:
-- SELECT * FROM users WHERE email = 'test@example.com';
