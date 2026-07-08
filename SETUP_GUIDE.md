# SETUP_GUIDE.md

## Complete Setup Instructions for RevenueForge

This guide walks you through setting up RevenueForge from scratch for local development and deployment.

### Total Setup Time: ~25 minutes

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
3. Open `lib/supabase/schema.sql`
4. Copy entire content and paste into SQL Editor
5. Click "Run"
6. Verify tables created:
   - profiles
   - projects
   - outreach_activities

### 2.4 Enable Authentication

1. Go to Authentication → Providers
2. Email/Password should be enabled by default
3. Go to Authentication → URL Configuration
4. Set:
   - Site URL: `http://localhost:3000` (dev) or your domain (production)
   - Redirect URLs: Add `http://localhost:3000/auth/callback` and your production URL

## Step 3: Optional AI Grader (2 min)

The onboarding Offer Gate uses a mock grader by default. For real LLM grading:

1. Get an OpenAI API key
2. Add to `.env.local`:
   - `OPENAI_API_KEY` = your key
   - `OPENAI_MODEL` = model name (defaults to `gpt-4o-mini`)

## Step 4: Local Development (5 min)

### 4.1 Start Dev Server

```bash
npm run dev
```

You should see:
```
> next dev
▲ Next.js 15
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
   - In Supabase → Profiles table, check a row was created

3. **Pass the Offer Gate**
   - You should land on `/onboarding`
   - Submit a one-sentence offer with a specific buyer, product, and outcome
   - Score 85 or above creates the project and redirects to `/gauntlet`

4. **Test Gauntlet (Milestone Ladder)**
   - Log 5 outreach contacts
   - The ladder shows M2 progress (0/5 to 5/5)
   - On the 5th contact, you are redirected to the dashboard

5. **Test Dashboard**
   - Verify projects list shows your created project
   - Create another project via the "New Project" button
   - Check the milestone ladder shows M1 and M2 achieved

6. **Test Outcome Upgrades**
   - Back on `/gauntlet` entries (before unlocking) or by logging with an outcome,
     mark a contact "Got reply" or "Committed"
   - M3 counts replies (commitments included); M4 counts commitments
   - Downgrades are rejected by the database

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
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;
```

### Issue: "Middleware not enforcing the milestone gate"

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
- [ ] CORS configured in Supabase
- [ ] Rate limiting configured
- [ ] Error tracking set up (Sentry)
- [ ] Monitoring enabled
- [ ] Backup strategy in place

## Next Steps

1. **Read the code**: Start with `app/gauntlet/page.tsx` to understand the flow
2. **Modify branding**: Update `app/layout.tsx` and colors in `tailwind.config.ts`
3. **Add features**: Reference `FEATURES.md` for roadmap

## Getting Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
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
