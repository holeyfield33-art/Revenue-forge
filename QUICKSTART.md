# QUICKSTART.md

## 🚀 30-Minute Launch

Get RevenueForge running locally in 30 minutes. No fluff.

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (free tier works)

### Phase 1: Setup (5 min)

```bash
# 1. Install dependencies
npm install

# 2. Get Supabase credentials
# Go to https://app.supabase.com
# Create new project (select region)
# Wait for provisioning
# Go to Settings → API → Copy:
#   - Project URL → NEXT_PUBLIC_SUPABASE_URL
#   - Anon Key → NEXT_PUBLIC_SUPABASE_ANON_KEY
#   - Service Role Key → SUPABASE_SERVICE_ROLE_KEY

# 3. Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

### Phase 2: Database (5 min)

```bash
# 1. Copy the SQL schema
cat lib/supabase/schema.sql

# 2. In Supabase Dashboard:
#    - Go to SQL Editor
#    - Paste entire schema.sql
#    - Click "Run"

# 3. Verify tables exist:
#    - profiles ✓
#    - daily_quota_logs ✓
#    - projects ✓
#    - outreach_activities ✓
```

### Phase 3: Run Locally (5 min)

```bash
# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Phase 4: Test the Flow (10 min)

**Test 1: Create Account**
```
1. Go to http://localhost:3000/auth/signup
2. Email: test@example.com
3. Password: Test123!@#
4. Click "Create Account"
5. Should redirect to /gauntlet
```

**Test 2: Create Project & Log Contacts**
```
1. Click "Create First Project"
2. Name: "My SaaS"
3. Click "Create"
4. Log 5 contacts:
   - Platform: Email
   - Contact: founder@company.com
   - Notes: (optional)
   - Click "Log Contact"
5. Repeat 4 more times
6. On 5th contact → auto-redirect to /dashboard
```

**Test 3: View Dashboard**
```
1. Should show "5/5" quota complete
2. Project "My SaaS" should be listed
3. Click "New Project" and create another
4. Both should appear in list
```

**Test 4: Test Quota Reset**
```
1. In Supabase → SQL Editor:
   UPDATE daily_quota_logs 
   SET date = CURRENT_DATE + INTERVAL '1 day'
   WHERE date = CURRENT_DATE;

2. Refresh browser
3. Should redirect to /gauntlet
4. Counter should show "0/5" again
```

## 🎯 Common Issues

### "Can't connect to Supabase"

```bash
# Verify env vars
grep SUPABASE .env.local

# Restart dev server
# Ctrl+C
npm run dev
```

### "No tables in database"

```bash
# In Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# If empty, run schema.sql again
```

### "Auth not working"

```bash
# In Supabase → Authentication:
# 1. Email provider should be enabled
# 2. Check Site URL matches localhost:3000
# 3. Check Redirect URLs includes callback
```

### "RLS policy errors"

```bash
# In Supabase → Tables → profiles → RLS:
# Should see green checkmarks on all policies
# If not, click "Enable RLS" again
```

## 🚀 Deploy (Pick One)

### Option A: Vercel (Easiest)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push

# 2. Go to https://vercel.com
# 3. Import GitHub repo
# 4. Add env vars from .env.local
# 5. Deploy!
```

### Option B: Docker Locally

```bash
docker build -t revenueforge .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=xxx \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=yyy \
  revenueforge
```

### Option C: Render.com

```
1. Connect GitHub account
2. Create Web Service
3. Select Revenue-forge repo
4. Build: npm run build
5. Start: npm start
6. Add environment variables
7. Deploy!
```

## 📚 Next Steps

1. **Read**: `SETUP_GUIDE.md` for deeper setup
2. **Understand**: `ARCHITECTURE.md` for system design
3. **Reference**: `API_REFERENCE.md` for all endpoints
4. **Roadmap**: `FEATURES.md` for future phases

## 🎓 Learning the Codebase

**Core Flow** (15 min read):
1. `middleware.ts` - Quota gate logic
2. `app/gauntlet/page.tsx` - Form UI
3. `app/actions.ts` - Server actions
4. `lib/supabase/schema.sql` - Database

**Advanced** (30 min read):
1. `ARCHITECTURE.md` - Full system design
2. `lib/supabase/server.ts` - DB connection
3. `app/dashboard/page.tsx` - Project management
4. `app/auth/` - Authentication flow

## 💡 Pro Tips

```bash
# Check dev server logs
npm run dev  # Ctrl+Shift+D in VS Code

# Build for production
npm run build
npm start

# Lint your code
npm run lint

# Check for TypeScript errors
npx tsc --noEmit

# View database in real-time
# Supabase Dashboard → Table Editor
```

## 🔐 Security Notes

- ✅ RLS enforces data isolation at database level
- ✅ Server Actions protect mutations
- ✅ JWT tokens in httpOnly cookies
- ✅ Middleware validates on every request
- ⚠️ Never commit `.env.local`
- ⚠️ Keep `SUPABASE_SERVICE_ROLE_KEY` secret

## 📊 Monitoring

```bash
# Check Supabase dashboard for:
# - Active sessions
# - Database performance
# - Auth logs
# - RLS violations

# Monitor logs:
# Supabase → Logs
```

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Signup creates user in auth.users
2. ✅ Profile auto-created with tier='free'
3. ✅ Middleware redirects to /gauntlet
4. ✅ Logging contacts increments counter
5. ✅ Quota complete auto-redirects to dashboard
6. ✅ Projects appear in dashboard list
7. ✅ Projects persist after refresh
8. ✅ Logout removes session
9. ✅ Next day shows 0/5 quota again

## 🆘 Need Help?

1. Check `SETUP_GUIDE.md` troubleshooting section
2. Review `ARCHITECTURE.md` for system overview
3. Check browser dev tools (F12)
4. Check Supabase logs
5. Open GitHub issue with:
   - Error message
   - Steps to reproduce
   - Screenshots
   - Browser console logs

---

**Total time to launch: 30 minutes**
**Time to first contact logged: 35 minutes**
**Time to production ready: Add 1-2 hours for env setup + testing**

Now go build! 🚀
