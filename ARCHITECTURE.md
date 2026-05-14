# ARCHITECTURE.md

## RevenueForge System Architecture

### Overview

RevenueForge is built on a modern serverless architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                  User Interface Layer               │
│    Next.js 13+ App Router (React Components)        │
│  ├─ Auth Pages (Login, Signup)                      │
│  ├─ Gauntlet Page (Quota Entry)                     │
│  └─ Dashboard (Project Management)                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Application Layer                      │
│    Next.js Server Actions & Middleware             │
│  ├─ Middleware (Quota Gate)                        │
│  ├─ Server Actions (CRUD Operations)               │
│  └─ API Routes (Webhooks)                          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│             Data Access Layer                       │
│    Supabase Client (Auth & Database)               │
│  ├─ Authentication (JWT via Supabase Auth)         │
│  ├─ Database Client (PostgreSQL via Supabase)      │
│  └─ RPC Calls (Business Logic)                     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│            Infrastructure Layer                     │
│              Supabase (SaaS)                        │
│  ├─ PostgreSQL Database                            │
│  ├─ Authentication Service                         │
│  ├─ Row-Level Security (RLS)                       │
│  ├─ RPC Functions                                  │
│  └─ Automated Backups                              │
└─────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Next.js Frontend (App Router)

**Files**: `app/**/*.tsx`

**Features**:
- Server Components (default)
- Client Components (with `'use client'`)
- Server Actions for mutations
- Middleware for authentication

**Key Pages**:
- `/`: Redirect logic based on quota
- `/auth/login`: Email/password login
- `/auth/signup`: Account creation
- `/gauntlet`: Daily quota form
- `/dashboard`: Project management

---

### 2. Authentication Flow

**File**: Supabase Auth built-in

```
User → Signup/Login → Supabase Auth → JWT Token → Cookies
                          ↓
                    Email Verification
                          ↓
                    Profile Created
```

**Session Lifecycle**:
1. User signs up via `/auth/signup`
2. Supabase creates auth user and sends verification email
3. Email link verified
4. JWT stored in httpOnly cookie
5. Middleware validates on each request
6. Token auto-refreshes before expiry

---

### 3. Quota Gate Mechanism

**File**: `middleware.ts`

```
Request → Middleware
    ↓
Auth Check (JWT valid?)
    ↓
Protected Route? (/gauntlet, /dashboard)
    ↓
Call check_outreach_gate RPC
    ↓
quota_met=false → Redirect /gauntlet
quota_met=true → Redirect /dashboard
Public Route → Pass through
```

**Performance**: RPC call is <50ms with database indexes

---

### 4. Outreach Logging

**Files**: 
- `app/gauntlet/page.tsx` (UI)
- `app/actions.ts` (Server Action)
- Database RPC function

```
User Form Submission
    ↓
Server Action: logOutreachActivity()
    ↓
Call DB RPC: log_outreach_activity()
    ↓
Database Operations (Atomic):
  1. Insert outreach_activities row
  2. Update/create daily_quota_logs row
  3. Return updated count
    ↓
quota_met? → Redirect to dashboard
```

---

### 5. Project Management

**Server Actions**:
- `createProject()`
- `getProjects()`
- `updateProject()`
- `deleteProject()`

**RLS Policy**:
```sql
SELECT * FROM projects WHERE user_id = auth.uid()
```

**Data Flow**:
```
Client Component → Server Action → Supabase → Client Update
```

---

## Database Schema

### Tables

```
┌─────────────────────────────────────────┐
│ auth.users (Built-in Supabase)         │
├─────────────────────────────────────────┤
│ id (UUID, PK)                           │
│ email (TEXT, UNIQUE)                    │
│ encrypted_password                      │
│ email_confirmed_at                      │
│ last_sign_in_at                         │
└─────────────────────────────────────────┘
        ↑
        │ Foreign Key
        │
┌─────────────────────────────────────────┐
│ profiles                                │
├─────────────────────────────────────────┤
│ id (UUID, PK)                           │
│ user_id (UUID, FK → auth.users)         │
│ tier (free | pro | max)                 │
│ daily_quota (INT)                       │
│ created_at, updated_at                  │
└─────────────────────────────────────────┘
        ↑
        │ One-to-Many
        │
┌──────────────────────────────────────────┐
│ daily_quota_logs                         │
├──────────────────────────────────────────┤
│ id (UUID, PK)                            │
│ user_id (UUID, FK)                       │
│ date (DATE)                              │
│ outreach_count (INT)                     │
│ UNIQUE(user_id, date)                    │
│ Index: (user_id, date)                   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ projects                                 │
├──────────────────────────────────────────┤
│ id (UUID, PK)                            │
│ user_id (UUID, FK)                       │
│ name (TEXT)                              │
│ description (TEXT)                       │
│ github_url (TEXT)                        │
│ status (in_gauntlet | validated | dead)  │
│ gauntlet_start_date (TIMESTAMP)          │
│ created_at, updated_at                   │
│ Index: (user_id)                         │
└──────────────────────────────────────────┘
        ↑
        │ One-to-Many
        │
┌──────────────────────────────────────────┐
│ outreach_activities                      │
├──────────────────────────────────────────┤
│ id (UUID, PK)                            │
│ user_id (UUID, FK)                       │
│ project_id (UUID, FK)                    │
│ platform (email | twitter | linkedin)    │
│ contact_info (TEXT)                      │
│ date (DATE)                              │
│ notes (TEXT)                             │
│ created_at                               │
│ Index: (user_id, date)                   │
└──────────────────────────────────────────┘
```

### Indexes

**Performance Critical**:
```sql
-- Daily quota lookup (middleware)
CREATE INDEX idx_daily_quota_logs_user_date 
  ON daily_quota_logs(user_id, date);

-- Projects list
CREATE INDEX idx_projects_user_id 
  ON projects(user_id);

-- Outreach history
CREATE INDEX idx_outreach_activities_user_date 
  ON outreach_activities(user_id, date);
```

---

## Security Model

### 1. Authentication

```
Email/Password → Supabase Auth → JWT → httpOnly Cookie
                                        ↓
                              Middleware validates
                                        ↓
                              User claims extracted
                                        ↓
                              auth.uid() available
```

### 2. Row-Level Security (RLS)

**Profile Policy**:
```sql
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);
```

**Projects Policy**:
```sql
CREATE POLICY "Users can only see own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);
```

**Benefits**:
- Database enforces access control
- SQL injection safe
- Works at query level (no data leaks)
- Scales without code changes

### 3. Server Actions

All mutations happen server-side:
```typescript
'use server'  // ← Only runs on server
export async function logOutreachActivity(input) {
  // Client can't bypass this
  const user = await supabase.auth.getUser();
  // Server validates user before mutation
}
```

### 4. Middleware CSRF Protection

Next.js built-in CSRF protection for Server Actions

---

## Data Flow Examples

### Example 1: Daily Outreach Quota Reset

**Scenario**: User logs in on day 2

```
1. User → Middleware
2. Middleware → RPC check_outreach_gate
3. RPC checks daily_quota_logs WHERE date = TODAY
4. If no row exists → Count = 0 → quota_met = false
5. Middleware → Redirect to /gauntlet
6. User sees "0/5" counter
```

**SQL in RPC**:
```sql
SELECT COALESCE(outreach_count, 0) INTO today_count
FROM daily_quota_logs
WHERE user_id = user_id_param AND date = CURRENT_DATE;
```

### Example 2: Logging a Contact

**Scenario**: User fills gauntlet form and submits

```
1. Form submit (email, twitter handle, notes)
2. Client → Server Action logOutreachActivity
3. Server Action:
   a. Get user from JWT
   b. Call RPC log_outreach_activity
4. RPC (Atomic Transaction):
   a. INSERT into outreach_activities
   b. UPDATE/INSERT daily_quota_logs (outreach_count++)
   c. SELECT new count
5. Return {activity_id, today_count, quota_met, remaining}
6. Client:
   - Update UI progress bar
   - Check if quota_met
   - Auto-redirect if complete
```

### Example 3: Project Creation

**Scenario**: User creates new project

```
1. Dialog form filled
2. Client → Server Action createProject()
3. Server Action:
   a. Get user
   b. INSERT projects row
   c. SELECT to get full record
4. Return new project
5. Client:
   a. Add to local state
   b. Close dialog
   c. Update projects list UI
```

---

## Performance Considerations

### Query Performance

**Index Strategy**:
- `daily_quota_logs(user_id, date)` for gate checks
- `projects(user_id)` for dashboard list
- `outreach_activities(user_id, date)` for analytics

**Optimization**:
- RPC functions run on DB (no N+1)
- Indexes ensure sub-50ms queries
- Connection pooling via Supabase

### Caching Strategy

**Future Enhancement** (Phase 2+):
- Redis cache for quota status
- Stale-while-revalidate for projects list
- ISR (Incremental Static Regeneration) for public pages

### Middleware Performance

**Current**: RPC call on every request to protected routes
- **Impact**: ~50ms per request
- **Solution**: Cache quota status in cookie (Phase 1)

---

## Deployment Architecture

### Local Development

```
npm run dev → Next.js Dev Server (Port 3000)
    ↓
Connects to Supabase (Cloud)
    ↓
Database queries work locally
```

### Production (Vercel Example)

```
GitHub Push → Vercel Webhook
    ↓
Build (npm run build)
    ↓
Deploy Edge Functions + Serverless Functions
    ↓
Connects to Supabase (Production)
    ↓
Serves globally via CDN
```

### Disaster Recovery

**Backup Strategy**:
- Supabase daily automated backups
- Point-in-time recovery available
- Manual export option

**Failover**:
- Vercel provides failover regions
- Supabase has HA setup
- No single point of failure

---

## Monitoring & Observability

### Logging

**Structured Logging** (Planned):
- Request logs
- Error tracking (Sentry)
- Performance monitoring (DataDog)

### Metrics

**Key Metrics**:
- Daily Active Users (DAU)
- Quota completion rate
- Project creation rate
- System uptime

---

## Scalability

### Current Limits

- **Users**: Unlimited (Supabase scales)
- **Projects**: Unlimited (indexed queries)
- **Outreach Activities**: Unlimited (archived monthly)
- **Requests**: Rate limited by tier (future)

### Scale-to-Production Checklist

- [ ] Enable database read replicas
- [ ] Implement Redis caching
- [ ] Set up CDN for static assets
- [ ] Configure WAF rules
- [ ] Enable monitoring & alerting
- [ ] Set up backup automation

---

## Future Architectural Changes

### Phase 2 (Stripe Integration)
- Add payment webhook handler
- Update RLS for multiple tiers
- Add job queue for async tasks

### Phase 3 (Teams)
- Add workspace table
- Implement team RLS policies
- Add activity log table

### Phase 4 (CRM Integration)
- Add external API layer
- Job queue for syncing
- Webhook receivers

### Phase 5 (Analytics)
- Time-series data warehouse
- Analytics database replica
- Reporting engine

---

Last Updated: May 2026
