# SETUP_GUIDE.md

## Complete Setup Instructions for RevenueForge

This guide walks you through setting up RevenueForge from scratch for local development and deployment.

### Total Setup Time: ~30 minutes

## Step 1: Repository Setup (5 min)

```bash
# Clone the repository
git clone https://github.com/holeyfield33-art/Revenue-forge.git
cd Revenue-forge

# Install dependencies
npm install

# Create .env.local from template
cp .env.local.example .env.local
```

## Step 2: Supabase Setup (10 min)

### 2.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Enter:
   - Project name: `revenueforge` (or your choice)
   - Password: (save securely)
   - Region: Choose closest to your users
4. Wait for provisioning (~2 min)

### 2.2 Get Your Credentials

Once project is ready:
1. Go to Settings → API
2. Copy these values to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key
   - `SUPABASE_SERVICE_ROLE_KEY` = Service role key

Example:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Set Up Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Click "New Query"
3. Open `/workspaces/Revenue-forge/lib/supabase/schema.sql`
4. Copy entire content and paste into SQL Editor
5. Click "Run"
6. Verify tables created:
   - profiles
   - daily_quota_logs
   - projects
   - outreach_activities

### 2.4 Enable Authentication

1. Go to Authentication → Providers
2. Email/Password should be enabled by default
3. Go to Authentication → URL Configuration
4. Set:
   - Site URL: `http://localhost:3000` (dev) or your domain (production)
   - Redirect URLs: Add `http://localhost:3000/auth/callback` and your production URL

## Step 3: Stripe Setup (5 min) [Optional for Dev]

### 3.1 Create Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Create account and verify email
3. Go to Dashboard
4. Switch to "Test Mode" (toggle in top left)

### 3.2 Get API Keys

1. Go to Developers → API Keys
2. Copy these to `.env.local`:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Publishable key
   - `STRIPE_SECRET_KEY` = Secret key

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
```

### 3.3 Create Products (Optional)

For testing tier upgrades:
1. Go to Products
2. Create three products:
   - **Free**: $0/month (default)
   - **Pro**: $49/month
   - **Max**: $99/month

## Step 4: Local Development (5 min)

### 4.1 Start Dev Server

```bash
npm run dev
```

You should see:
```
> next dev
▲ Next.js 15.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

### 4.2 Test the Flow

1. **Create Account**
   - Go to `http://localhost:3000/auth/signup`
   - Enter email: `test@example.com`
   - Password: `Test123!@#`
   - Click "Create Account"

2. **Verify Email Created Profile**
   - In Supabase → Authentication, you should see the user
   - In Supabase → Profiles table, check a row was created with `tier: 'free'`

3. **Test Gauntlet (Quota Gate)**
   - Go to `http://localhost:3000` (should redirect to gauntlet)
   - Create a project: "My First SaaS"
   - Log 5 outreach contacts
   - Should redirect to dashboard

4. **Test Dashboard**
   - Verify projects list shows your created project
   - Create another project via the "New Project" button
   - Check quota status shows "5 / 5"

5. **Test Daily Reset**
   - Manually update database to simulate next day:
   ```sql
   UPDATE daily_quota_logs 
   SET date = CURRENT_DATE + INTERVAL '1 day'
   WHERE user_id = (SELECT id FROM auth.users LIMIT 1);
   ```
   - Refresh page - you should see "0 / 5" again

## Step 5: Troubleshooting

### Issue: "Can't connect to Supabase"

**Check:**
```bash
# Verify .env.local exists
cat .env.local

# Check if values are set
echo $NEXT_PUBLIC_SUPABASE_URL
```

**Fix:**
- Ensure all three Supabase values are in `.env.local`
- Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: "Auth users table not found"

**Fix:**
- This is normal - Supabase creates it automatically
- Just sign up - it will be created

### Issue: "RLS policy prevents access"

**Check:**
1. Go to Supabase → Tables
2. Click each table → RLS
3. Verify policies are enabled (should be GREEN checkmarks)

**Fix:**
```sql
-- Re-enable RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quota_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;
```

### Issue: "Middleware not enforcing quota"

**Check:**
1. Verify `middleware.ts` exists in root directory
2. Check browser dev tools → Network tab
3. Look for redirect from `/dashboard` to `/gauntlet`

**Debug:**
```bash
# Add this to middleware.ts temporarily
console.log('Middleware running for:', path);
console.log('Gate status:', gateStatus);
```

## Step 6: Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to connect GitHub
```

### Option B: Docker Locally

```bash
# Build Docker image
docker build -t revenueforge .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx \
  revenueforge
```

## Step 7: Database Backup (Important!)

```bash
# Export database from Supabase dashboard
# Settings → Backups → Download

# Or via CLI:
# npm install -g supabase
# supabase db pull
```

## Step 8: First Production Deployment Checklist

- [ ] All environment variables configured
- [ ] `.env.local` is in `.gitignore` (don't commit!)
- [ ] Database schema applied to production Supabase
- [ ] Supabase Auth URLs configured
- [ ] Stripe webhook endpoint created (if using payments)
- [ ] CORS configured in Supabase
- [ ] Rate limiting configured
- [ ] Error tracking set up (Sentry)
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Next Steps

1. **Read the code**: Start with `app/gauntlet/page.tsx` to understand the flow
2. **Modify branding**: Update `app/layout.tsx` and colors in `tailwind.config.ts`
3. **Test payments**: Complete Stripe integration in Phase 2
4. **Add features**: Reference `FEATURES.md` for roadmap

## Getting Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Stripe Docs**: [stripe.com/docs](https://stripe.com/docs)
- **GitHub Issues**: Open an issue in the repo

## Performance Tips

```bash
# Build for production
npm run build

# Test production build locally
npm start

# Analyze bundle size
npm install -g next-bundle-analyzer
```

---

You're all set! Your RevenueForge instance is ready. 🚀
