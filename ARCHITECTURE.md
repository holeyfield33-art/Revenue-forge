# ARCHITECTURE.md

## RevenueForge System Architecture

### Overview

RevenueForge is built on a modern serverless architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────┐
│                  User Interface Layer               │
│    Next.js 15 App Router (React Components)         │
│  ├─ Auth Pages (Login, Signup)                      │
│  ├─ Onboarding Page (Offer Gate)                    │
│  ├─ Gauntlet Page (Outreach Logging)                │
│  └─ Dashboard (Project Management)                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│              Application Layer                      │
│    Next.js Server Actions & Middleware             │
│  ├─ Middleware (Milestone Gate)                    │
│  ├─ Server Actions (CRUD Operations)               │
│  └─ API Routes (Health Check)                      │
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

- `/`: Redirect logic based on milestone state
- `/auth/login`: Email/password login
- `/auth/signup`: Account creation
- `/onboarding`: Offer Gate grading
- `/gauntlet`: Outreach logging and milestone ladder
- `/dashboard`: Project management and milestone stats

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

### 3. Milestone Gate Mechanism

**File**: `middleware.ts`

```
Request → Middleware
    ↓
Auth Check (JWT valid?)
    ↓
Protected Route? (/onboarding, /gauntlet, /dashboard)
    ↓
Approved project (offer_score >= 85)?
    no → Redirect /onboarding
    ↓
Call check_milestone_gate RPC
    ↓
dashboard_unlocked=false → Redirect /gauntlet
dashboard_unlocked=true → Redirect /dashboard
Public Route → Pass through
```

**Milestones** (cumulative, computed from `outreach_activities` — no reset):

| Milestone          | Requirement                                     | Effect                  |
| ------------------ | ----------------------------------------------- | ----------------------- |
| M1 Forge the Offer | a project with `offer_score >= 85`              | unlocks `/gauntlet`     |
| M2 First Sparks    | 5 rows in `outreach_activities`                 | unlocks `/dashboard`    |
| M3 Conversations   | 3 rows with `outcome IN ('reply','commitment')` | displayed progress only |
| M4 Proof of Demand | 1 row with `outcome = 'commitment'`             | displayed progress only |

`dashboard_unlocked = m1 AND m2`.

**Performance**: RPC call is <50ms with database indexes

---

### 4. Outreach Logging

**Files**:

- `app/gauntlet/page.tsx` (UI)
- `app/actions.ts` (Server Action)
- Database RPC function

```
User Form Submission (with outcome: sent | reply | commitment)
    ↓
Server Action: logOutreachActivity()
    ↓
Call DB RPC: log_outreach_activity()
    ↓
Database Operations:
  1. Insert outreach_activities row (with outcome)
  2. Recompute milestone state
    ↓
dashboard_unlocked? → Redirect to dashboard
```

**Outcome upgrades**: `upgradeOutreachOutcome()` calls the
`upgrade_outreach_outcome` RPC. Transitions only harden
(`sent -> reply`, `sent -> commitment`, `reply -> commitment`);
downgrades are rejected. The RPC runs with invoker rights so RLS
restricts it to the caller's own activities.

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
│ created_at, updated_at                  │
└─────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ projects                                 │
├──────────────────────────────────────────┤
│ id (UUID, PK)                            │
│ user_id (UUID, FK)                       │
│ name (TEXT)                              │
│ description (TEXT)                       │
│ github_url (TEXT)                        │
│ offer_sentence (TEXT)                    │
│ offer_score (INT)                        │
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
│ outcome (sent | reply | commitment)      │
│ notes (TEXT)                             │
│ created_at                               │
│ Index: (user_id, date)                   │
└──────────────────────────────────────────┘
```

### Indexes

**Performance Critical**:

```sql
-- Projects list
CREATE INDEX idx_projects_user_id
  ON projects(user_id);

-- Outreach history and milestone counts
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
"use server"; // ← Only runs on server
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

### Example 1: Milestone Gate Check

**Scenario**: User with 3 logged contacts opens /dashboard

```
1. User → Middleware
2. Middleware → RPC check_milestone_gate
3. RPC counts outreach_activities for the user
4. sent = 3 → m2 = false → dashboard_unlocked = false
5. Middleware → Redirect to /gauntlet
6. User sees the ladder: M2 at "3 / 5"
```

**SQL in RPC**:

```sql
SELECT
  COUNT(*),
  COUNT(*) FILTER (WHERE outcome IN ('reply', 'commitment')),
  COUNT(*) FILTER (WHERE outcome = 'commitment')
INTO sent_count, reply_count, commitment_count
FROM outreach_activities
WHERE user_id = user_id_param;
```

### Example 2: Logging a Contact

**Scenario**: User fills gauntlet form and submits

```
1. Form submit (platform, contact, outcome, notes)
2. Client → Server Action logOutreachActivity
3. Server Action:
   a. Get user from JWT
   b. Call RPC log_outreach_activity
4. RPC:
   a. INSERT into outreach_activities
   b. Recompute milestone state
5. Return {activity_id, m1..m4, sent, replies, commitments, dashboard_unlocked}
6. Client:
   - Update the milestone ladder
   - Check dashboard_unlocked
   - Auto-redirect if the gate opened
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

- `projects(user_id)` for dashboard list
- `outreach_activities(user_id, date)` for milestone counts and history

**Optimization**:

- RPC functions run on DB (no N+1)
- Indexes ensure sub-50ms queries
- Connection pooling via Supabase

### Caching Strategy

**Future Enhancement** (Phase 1+):

- Redis cache for milestone status
- Stale-while-revalidate for projects list
- ISR (Incremental Static Regeneration) for public pages

### Middleware Performance

**Current**: RPC call on every request to protected routes

- **Impact**: ~50ms per request
- **Solution**: Cache milestone status in cookie (future)

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
- Milestone completion rate
- Project creation rate
- System uptime

---

## Scalability

### Current Limits

- **Users**: Unlimited (Supabase scales)
- **Projects**: Unlimited (indexed queries)
- **Outreach Activities**: Unlimited (indexed queries)

### Scale-to-Production Checklist

- [ ] Enable database read replicas
- [ ] Implement Redis caching
- [ ] Set up CDN for static assets
- [ ] Configure WAF rules
- [ ] Enable monitoring & alerting
- [ ] Set up backup automation

---

## Future Architectural Changes

### Phase 1 (Analytics)

- Time-series data warehouse
- Analytics database replica
- Reporting engine

### Phase 2 (Teams)

- Add workspace table
- Implement team RLS policies
- Add activity log table

### Phase 3 (CRM Integration)

- Add external API layer
- Job queue for syncing
- Webhook receivers

---

Last Updated: July 2026
