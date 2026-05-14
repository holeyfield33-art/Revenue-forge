# DEPLOYMENT.md

## Environment Setup

### 1. Supabase Configuration

#### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key
4. Go to Database → SQL Editor
5. Execute the SQL schema from `lib/supabase/schema.sql`

#### Configure Authentication
1. In Supabase dashboard, go to Authentication → Providers
2. Ensure Email/Password provider is enabled
3. Configure email settings under Email Templates if needed
4. Add your application URLs to Site URL and Redirect URLs in Auth Settings

#### Enable RLS and RPC
1. RLS is enabled by default for all tables in schema.sql
2. RPC functions are created by the schema.sql execution

### 2. Stripe Configuration

#### Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Create account and verify email
3. Go to Dashboard → API keys
4. Copy Publishable Key and Secret Key
5. Save to environment variables

#### Create Products
In Stripe Dashboard → Products, create:
- **Free** (no upgrade needed)
- **Pro** ($49/month, quota: 20/day)
- **Max** ($99/month, quota: 50/day)

### 3. Environment Variables

Create `.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Deployment Options

### Option 1: Vercel (Recommended)

**Fastest deployment for Next.js**

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables
5. Deploy

```bash
# Or deploy via CLI
npm install -g vercel
vercel
```

### Option 2: Render.com

**Good alternative with PostgreSQL support**

1. Connect GitHub account
2. Create new Web Service
3. Connect Revenue-forge repository
4. Settings:
   - Runtime: Node
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy

### Option 3: Coolify (Self-Hosted)

**For full control and multi-VPS routing**

1. Install Coolify on your VPS
2. Connect GitHub repository
3. Create application
4. Set build and start commands
5. Add environment variables
6. Deploy

```bash
# Initial Coolify setup on VPS
curl -fsSL https://coolify.io/install.sh | bash
```

### Option 4: Docker + Any Cloud

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Production Checklist

- [ ] All environment variables configured
- [ ] Supabase project created and schema applied
- [ ] Stripe products created
- [ ] Email authentication tested
- [ ] Quota gate tested (login, check quota, log outreach)
- [ ] Dashboard loads after quota met
- [ ] Project CRUD operations working
- [ ] Database backups enabled
- [ ] Error logging configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured
- [ ] CORS configured if needed

## Monitoring

### Supabase
- Monitor database performance in Supabase dashboard
- Check authentication logs
- Review RLS policy execution

### Application
- Set up error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user signup/conversion funnel

### Stripe
- Monitor payment failures
- Review webhook delivery status
- Check for declined transactions

## Scaling Considerations

### Database
- Enable read replicas for high traffic
- Implement query optimization
- Consider connection pooling

### Application
- Use CDN for static assets (Cloudflare)
- Implement Redis for caching
- Consider horizontal scaling

### File Storage
- Use Supabase Storage for user uploads
- Implement CDN for media delivery

## Troubleshooting

### "Can't connect to Supabase"
- Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Check network connectivity
- Ensure Supabase project is active

### "RLS policy prevents access"
- Verify user_id matches auth.uid()
- Check RLS policies are correctly set
- Ensure user is authenticated

### "Middleware not enforcing quota"
- Check middleware.ts is in root directory
- Verify RPC function exists
- Check authentication context in middleware

### "Stripe webhook not firing"
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook endpoint is registered
- Review Stripe dashboard event logs

## Rollback Plan

If deployment fails:

1. **Revert code**: `git revert <commit>`
2. **Rollback database**: Use Supabase backups
3. **Clear cache**: Clear CDN cache if used
4. **Notify users**: Send status update if needed

## Next Steps

1. Set up continuous integration/deployment
2. Implement error tracking
3. Set up analytics
4. Configure monitoring alerts
5. Plan for disaster recovery
