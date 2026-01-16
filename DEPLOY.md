# Deployment Instructions

You are securely logged in as `logeshrajkumar2025-9791`.
Since you want to link to an **existing** Vercel project, follow these steps:

## Step 1: Link Project
Run this command in your terminal:
```bash
npx vercel link
```
1. It will ask: `Set up and deploy “...\texconnect-msme”? [Y/n]` → Type **Y**
2. It will ask: `Which scope do you want to deploy to?` → Press **Enter** (to select your account)
3. It will ask: `Link to existing project? [Y/n]` → Type **Y**
4. It will ask: `What’s the name of your existing project?` → **Type existing project name**

## Step 2: Deploy Production
Once linked, run:
```bash
npx vercel --prod
```
This will build your project using the `vercel.json` configuration I created and deploy it to your existing URL.

## Step 3: Verify Environment Variables
After deployment, go to your Vercel Dashboard → Settings → Environment Variables and ensure these are set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
