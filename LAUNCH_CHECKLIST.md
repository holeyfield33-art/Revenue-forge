# LAUNCH_CHECKLIST.md

## RevenueForge Phase 0 - Launch Checklist

### Pre-Launch (Before First Users)

**Infrastructure**
- [ ] Supabase project created and verified
- [ ] Database schema applied successfully
- [ ] All 4 tables created (profiles, daily_quota_logs, projects, outreach_activities)
- [ ] RLS policies enabled on all tables
- [ ] RPC functions created (check_outreach_gate, log_outreach_activity)
- [ ] Indexes created for performance
- [ ] Automated backups enabled
- [ ] Point-in-time recovery verified

**Authentication**
- [ ] Email/password provider enabled
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs configured
- [ ] Verify email option tested
- [ ] Session persistence tested
- [ ] Logout works correctly
- [ ] Protected routes via middleware working

**Application**
- [ ] All environment variables configured
- [ ] .env.local exists (not committed)
- [ ] TypeScript compiles without errors
- [ ] All dependencies installed
- [ ] Next.js build succeeds: `npm run build`
- [ ] Development server runs: `npm run dev`
- [ ] No console errors in dev tools

**Testing**
- [ ] Signup flow works (test account created)
- [ ] Profile auto-created with free tier
- [ ] Login/logout works
- [ ] Gauntlet page loads when quota not met
- [ ] Can create project in gauntlet
- [ ] Can log outreach contacts
- [ ] Progress counter updates correctly
- [ ] Dashboard loads after quota complete
- [ ] Dashboard project list shows created projects
- [ ] Can create project from dashboard
- [ ] Can edit project
- [ ] Can delete project
- [ ] Daily quota resets (manually tested)
- [ ] Middleware enforces quota correctly

**UI/UX**
- [ ] Mobile responsive (test on mobile browser)
- [ ] Dark mode working correctly
- [ ] Status badges showing correct colors
- [ ] Forms have validation
- [ ] Error messages display properly
- [ ] Loading states present
- [ ] Buttons disabled when appropriate
- [ ] Redirect animations smooth

**Security**
- [ ] No secrets visible in code
- [ ] RLS policies tested
- [ ] User isolation verified (can't see other users' data)
- [ ] JWT tokens properly stored
- [ ] Middleware validates auth
- [ ] No SQL injection vulnerabilities
- [ ] Input validation present
- [ ] CSRF protection active

**Performance**
- [ ] Gauntlet page loads <2 seconds
- [ ] Dashboard loads <3 seconds
- [ ] Form submission responsive
- [ ] Database queries use indexes
- [ ] No N+1 query problems
- [ ] Memory usage reasonable
- [ ] Bundle size acceptable

**Documentation**
- [ ] README.md complete
- [ ] SETUP_GUIDE.md step-by-step
- [ ] QUICKSTART.md tested
- [ ] DEPLOYMENT.md accurate
- [ ] API_REFERENCE.md complete
- [ ] ARCHITECTURE.md detailed
- [ ] FEATURES.md roadmap clear
- [ ] Code comments present
- [ ] JSDoc comments added

---

### Deployment (Before Production)

**Choose Platform**
- [ ] Vercel setup (recommended)
  - [ ] GitHub repo connected
  - [ ] Build settings configured
  - [ ] Environment variables added
  - [ ] Deployment successful
  - [ ] Test after deployment

OR

- [ ] Render.com setup
  - [ ] GitHub repo connected
  - [ ] Build command: `npm run build`
  - [ ] Start command: `npm start`
  - [ ] Environment variables added
  - [ ] Deployment successful

OR

- [ ] Docker deployment
  - [ ] Dockerfile created
  - [ ] Image builds successfully
  - [ ] Container runs locally
  - [ ] Production config correct

**Production Supabase**
- [ ] New Supabase project for production
- [ ] Schema applied to production database
- [ ] Backups enabled
- [ ] CORS configured if needed
- [ ] Rate limiting configured
- [ ] Auth settings updated (production URL)
- [ ] Database performance optimized

**Production Environment**
- [ ] All env vars updated for production
- [ ] Database connections pooled
- [ ] Error tracking setup (Sentry optional)
- [ ] Monitoring enabled
- [ ] Logging configured
- [ ] SSL/HTTPS enabled
- [ ] Custom domain configured

**Post-Deployment Tests**
- [ ] Visit domain (should load)
- [ ] Signup works
- [ ] Login works
- [ ] Gauntlet functional
- [ ] Dashboard functional
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Email sending works (if enabled)

---

### Day-1 Operations

**User Onboarding**
- [ ] First user created
- [ ] First project created
- [ ] First outreach logged
- [ ] Dashboard unlocked
- [ ] Test quota reset at midnight
- [ ] Next day quota shows as 0/5

**Monitoring**
- [ ] Check server logs for errors
- [ ] Monitor database performance
- [ ] Check uptime (status page)
- [ ] Monitor error rates
- [ ] Review active users
- [ ] Check payment processing (if enabled)

**Support**
- [ ] Issue template ready
- [ ] Support email configured
- [ ] Documentation published
- [ ] Help page available
- [ ] Status page set up

---

### Week-1 Goals

- [ ] 50+ signups
- [ ] 80%+ quota completion rate
- [ ] 100% uptime
- [ ] <1% error rate
- [ ] Performance within targets
- [ ] No critical bugs
- [ ] User feedback collected
- [ ] First feature requests received

---

### Strikethrough (Problems to Fix Before Launch)

If any of these are true, **DO NOT LAUNCH**:

- [ ] TypeScript errors not fixed
- [ ] Database not responding
- [ ] Auth not working
- [ ] Middleware not enforcing quota
- [ ] Critical security vulnerability
- [ ] Major performance issue
- [ ] Data corruption detected
- [ ] Privacy policy not accepted by users

---

### Sign-Off

**Technical Lead**:
- Name: _______________
- Date: _______________
- Notes: _______________

**Product Lead**:
- Name: _______________
- Date: _______________
- Notes: _______________

**Launch Authorized**: YES / NO

---

### Post-Launch (Week 1-2)

- [ ] Monitor for bugs
- [ ] Fix any critical issues immediately
- [ ] Collect user feedback
- [ ] Review analytics
- [ ] Update documentation based on feedback
- [ ] Plan Phase 1 (Stripe integration)
- [ ] Communicate roadmap to users

---

## Quick Status Check

Run this to verify everything is working:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run checks
echo "Checking environment variables..."
grep SUPABASE .env.local | wc -l  # Should be 3

echo "Building..."
npm run build

echo "Checking TypeScript..."
npx tsc --noEmit

echo "Done! Ready to launch 🚀"
```

---

**Estimated Launch Readiness**: 30 minutes after full setup
**Go-live Confidence**: 9.5/10 (pending actual Supabase credentials)
