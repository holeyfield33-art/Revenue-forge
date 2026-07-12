# QUICKSTART.md

## 🚀 30-Minute Launch

Get RevenueForge running locally in 30 minutes. No fluff.

### Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase account (the free plan works)

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
5. Should redirect to /onboarding
```

**Test 2: Pass the Offer Gate**

```
1. Write a one-sentence offer with a specific buyer,
   concrete product, and measurable outcome
2. Click "Submit Offer"
3. Score below 85 → rewrite and resubmit
4. Score 85+ → project created, redirect to /gauntlet
```

**Test 3: Log Contacts (Milestone M2)**

```
1. Log 5 contacts:
   - Platform: Email
   - Contact: founder@company.com
   - Outcome: Sent (default)
   - Notes: (optional)
   - Click "Log Contact"
2. The ladder shows M2 progress (1/5 ... 5/5)
3. On 5th contact → auto-redirect to /dashboard
```

**Test 4: View Dashboard**

```
1. Should show the milestone ladder with M1 and M2 achieved
2. Sent / Replies / Commitments / Reply Rate stats visible
3. Project should be listed
4. Click "New Project" and create another
5. Both should appear in list
```

**Test 5: Upgrade Outcomes (M3, M4)**

```
1. Mark a logged contact "Got reply" → replies count increases
2. Mark a contact "Committed" → commitments count increases
   (commitments also count as replies)
3. M3 completes at 3 replies; M4 at 1 commitment
4. Downgrades are rejected by the database
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

1. `middleware.ts` - Milestone gate logic
2. `app/gauntlet/page.tsx` - Ladder and form UI
3. `app/actions.ts` - Server actions
4. `lib/milestones.ts` - Milestone math
5. `lib/supabase/schema.sql` - Database

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

# Run the unit tests
npm test

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
2. ✅ Profile auto-created
3. ✅ Middleware redirects new users to /onboarding
4. ✅ Offer scored 85+ creates the project
5. ✅ Logging contacts advances the milestone ladder
6. ✅ Fifth contact auto-redirects to dashboard
7. ✅ Projects appear in dashboard list
8. ✅ Outcome upgrades move M3/M4; downgrades rejected
9. ✅ Logout removes session

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
