# Admin Profile Picture Debugging Guide

## Issue
Profile pictures for main admin and sub-admin are not displaying in the header menu, even though the images are stored in the Supabase database.

## Debugging Steps Added

### 1. **Context Level Debugging** (`SupabaseContext.tsx`)
Added logging in `mapDatabaseUserToType()` function:
- Logs when mapping admin users from database
- Shows both `profilepictureurl` (lowercase) and `profilePictureUrl` (camelCase)
- Displays the complete raw database user object
- Shows the final mapped `profilePictureUrl` value

### 2. **Dashboard Level Debugging** (`ModernAdminDashboard.tsx`)
Added `useEffect` to log current user data:
- Logs whenever `currentUser` changes
- Shows profile picture URL and other user details

Added `onError` handler to the profile image:
- Logs if the image fails to load
- Helps identify CORS or permission issues

## How to Debug

### Step 1: Open Browser Console
1. Log in as an admin (main or sub-admin)
2. Open Developer Tools (F12)
3. Go to the Console tab

### Step 2: Check the Logs

You should see logs in this order:

```javascript
// 1. When user data is fetched from database:
🔍 Mapping Admin User from Database: {
  email: "admin@example.com",
  firstname: "Admin",
  profilepictureurl: "https://...", // <-- This should have a URL
  profilePictureUrl: undefined,      // <-- Usually undefined from DB
  raw_dbUser: { ... }                // <-- Full database record
}

// 2. After mapping:
✅ Mapped Admin User Result: {
  email: "admin@example.com",
  profilePictureUrl: "https://..." // <-- Should match profilepictureurl above
}

// 3. In the dashboard:
Admin Dashboard - Current User: {
  id: "...",
  firstname: "...",
  role: "admin",
  profilePictureUrl: "https://...", // <-- Should have the URL here
  profilePicture: undefined
}
```

## Troubleshooting Based on Logs

### Case 1: `profilepictureurl` is `null` or `undefined` in first log
**Problem:** The URL is not in the database  
**Solution:** Check if the profile picture was properly uploaded:

```sql
-- Run in Supabase SQL Editor:
SELECT 
  id, 
  email, 
  firstname, 
  role,
  profilepictureurl 
FROM users 
WHERE role = 'admin';
```

If `profilepictureurl` is NULL, the image isn't saved. Re-upload the profile picture.

### Case 2: `profilepictureurl` exists but `profilePictureUrl` is still `undefined` after mapping
**Problem:** Mapping logic issue  
**Check:** The mapping code at line 89 in `SupabaseContext.tsx`:
```typescript
profilePictureUrl: dbUser.profilepictureurl || dbUser.profilePictureUrl,
```

### Case 3: URL exists in all logs but image doesn't display
**Problem:** Image URL is broken or inaccessible  
**Check:**
1. Copy the URL from console logs
2. Paste it directly in browser address bar
3. Check if image loads

If image doesn't load:
- **CORS Issue:** Check Supabase Storage bucket CORS settings
- **Permission Issue:** Make bucket publicly readable or use signed URLs
- **Wrong URL:** Verify the URL format matches Supabase storage

### Case 4: Console shows "Failed to load admin profile picture"
**Problem:** Image failed to load (404, CORS, etc.)  
**Solutions:**
1. Check Supabase Storage bucket exists
2. Verify bucket is set to public or has proper RLS policies
3. Check if file still exists in storage

## Quick Fixes

### Fix 1: Make Storage Bucket Public
In Supabase Dashboard:
1. Go to Storage
2. Find your bucket (e.g., 'profile-pictures')
3. Click Settings
4. Enable "Public bucket"

### Fix 2: Add RLS Policy for Public Read
```sql
-- Allow public read access to profile pictures
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-pictures' );
```

### Fix 3: Re-upload Profile Picture
1. Go to Admin Profile page
2. Upload a new profile picture
3. Check console logs during upload
4. Verify URL is saved to database

## Expected URL Format

Supabase Storage URLs should look like:
```
https://[project-ref].supabase.co/storage/v1/object/public/[bucket-name]/[file-path]
```

Example:
```
https://abcdefghijk.supabase.co/storage/v1/object/public/profile-pictures/admin_123.jpg
```

## Database Column Name

The database uses **lowercase** column names:
- Database column: `profilepictureurl` (all lowercase)
- TypeScript property: `profilePictureUrl` (camelCase)

The mapping function handles both cases automatically.

## Contact Points for Issues

After following the debugging steps, report:
1. What you see in each console log
2. The URL value (if any)
3. Whether the URL works when opened directly
4. Any error messages in console

This will help identify the exact issue!
