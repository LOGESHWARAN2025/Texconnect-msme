-- Run this query in Supabase SQL Editor to verify profile picture data exists
-- This will show you the exact data for admin users

SELECT 
  id,
  email,
  firstname,
  role,
  ismainadmin,
  profilepictureurl,
  profilepicture,
  CASE 
    WHEN profilepictureurl IS NOT NULL THEN 'HAS URL'
    WHEN profilepicture IS NOT NULL THEN 'HAS BASE64'
    ELSE 'NO PICTURE'
  END as picture_status,
  LENGTH(profilepictureurl) as url_length,
  LENGTH(profilepicture) as picture_length
FROM users 
WHERE role = 'admin'
ORDER BY ismainadmin DESC, email;

-- Expected output should show:
-- 1. Main admin row with ismainadmin = true
-- 2. Sub-admin rows with ismainadmin = false
-- 3. picture_status showing 'HAS URL' or 'HAS BASE64' (not 'NO PICTURE')
-- 4. url_length or picture_length showing a number (not NULL)

-- If you see 'NO PICTURE' or NULL lengths, the image is NOT in the database
-- If you see 'HAS URL' or 'HAS BASE64' with lengths, the data IS there but not loading
