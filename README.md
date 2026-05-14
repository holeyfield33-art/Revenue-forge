# RevenueForge

RevenueForge is a high-velocity validation and monetization command center for technical builders. It forces builders to prioritize sales over code-polishing through a structured 14-day "Gauntlet."

## The Golden Rule

**You cannot view your project dashboard, analytics, or metrics until you complete your daily sales activity.**

## Core Features

- **The Gauntlet**: Daily outreach quota enforcement (default: 5 contacts per day)
- **Access Gate**: Middleware-enforced quota check before dashboard access
- **Project Management**: Track multiple projects during validation
- **Quota Tracking**: Real-time daily outreach logging
- **Tech-Noir UI**: Dark mode, zinc/black backgrounds, red/white/green status indicators

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database & Auth**: Supabase (PostgreSQL + RLS)
- **Payments**: Stripe (for $49 tier upgrades)
- **Infrastructure**: Coolify / Render

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments feature)

### 1. Clone and Install

```bash
git clone <repo>
cd Revenue-forge
npm install
```

### 2. Configure Environment

Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

**Required values:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_SECRET_KEY`: Stripe secret key

### 3. Set Up Supabase Database

1. Go to your Supabase dashboard
2. Open the SQL editor
3. Copy and paste the entire contents of `lib/supabase/schema.sql`
4. Execute the SQL

This will create:
- `profiles` table (user tiers & quotas)
- `daily_quota_logs` table (outreach tracking)
- `projects` table (builder ideas)
- `outreach_activities` table (contact records)
- RLS policies for all tables
- RPC functions: `check_outreach_gate` and `log_outreach_activity`

### 4. Enable Supabase Auth

In Supabase dashboard:
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email settings as needed

### 5. Run Locally

```bash
npm run dev
```

Navigate to `http://localhost:3000`

## Project Structure

```
/workspaces/Revenue-forge
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home (redirects based on quota)
│   ├── globals.css              # Global styles
│   ├── actions.ts               # Server actions
│   ├── auth/                    # Authentication routes
│   │   ├── login/page.tsx       # Login page
│   │   ├── signup/page.tsx      # Sign-up page
│   │   └── layout.tsx           # Auth layout
│   ├── gauntlet/                # Gauntlet (quota enforcement)
│   │   └── page.tsx             # Daily quota form
│   └── dashboard/               # Unlocked dashboard
│       └── page.tsx             # Project management UI
├── components/
│   └── ui/                      # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── dialog.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase
│   │   ├── server.ts            # Server-side Supabase
│   │   └── schema.sql           # Database schema
│   ├── types/
│   │   └── database.ts          # TypeScript types
│   └── utils.ts                 # Utility functions
├── middleware.ts                 # Next.js middleware (quota gate)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── README.md
```

## Core Mechanical Loop (MVP)

### 1. **The Lock** (Middleware)
- User logs in
- Middleware checks if daily outreach quota is met
- Default quota: 5 contacts per day

### 2. **The Gate** (Input)
- If quota unmet → user trapped on `/gauntlet`
- Must log outbound contacts via rapid-entry form
- Can target any platform: Email, Twitter/X, LinkedIn, Other

### 3. **The Reward** (Output)
- After 5th contact logged → gate opens
- User gains access to `/dashboard`
- Can manage projects, track pipeline, prepare for next day's gauntlet

## Database Schema

### profiles
```sql
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- tier (free | pro | max)
- daily_quota (INT, default: 5)
- stripe_customer_id (TEXT, optional)
- created_at, updated_at
```

### daily_quota_logs
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- date (DATE)
- outreach_count (INT)
- UNIQUE(user_id, date)
```

### projects
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- name (TEXT)
- description (TEXT)
- github_url (TEXT)
- status (in_gauntlet | validated | dead)
- gauntlet_start_date (TIMESTAMP)
- created_at, updated_at
```

### outreach_activities
```sql
- id (UUID, PK)
- user_id (UUID, FK)
- project_id (UUID, FK)
- platform (email | twitter | linkedin | other)
- contact_info (TEXT)
- date (DATE)
- notes (TEXT)
- created_at
```

## RPC Functions

### check_outreach_gate(user_id_param UUID)
Returns JSON with:
- `quota_met` (boolean)
- `daily_quota` (int)
- `today_count` (int)
- `remaining` (int)

### log_outreach_activity(...)
Logs an outreach activity and increments daily quota count.

## Deployment

### Option 1: Coolify
1. Connect your GitHub repository
2. Create a new application
3. Select Node.js 18+
4. Set environment variables
5. Deploy

### Option 2: Render
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set build command: `npm run build`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

### Option 3: Vercel
1. Import project to Vercel
2. Set environment variables
3. Deploy

## Stripe Integration (Phase 2)

For tier upgrades (Pro/Max):
- Create Stripe products for each tier
- Add webhook handler for payment confirmation
- Update profile tier on successful payment
- Implement custom quota per tier

## Development Roadmap

- [ ] **Phase 1** (MVP - Done): Core gauntlet + dashboard
- [ ] **Phase 2**: Stripe integration + tier system
- [ ] **Phase 3**: Analytics & revenue tracking
- [ ] **Phase 4**: Team collaboration
- [ ] **Phase 5**: API for integrations

## Key Design Decisions

1. **Middleware-First Quota Enforcement**: Check happens at request level, not page level
2. **Server Actions for Data**: All mutations use Server Actions for security
3. **RLS for Row-Level Security**: All data access is user-isolated
4. **RPC Functions**: Complex business logic in database layer
5. **Dark Mode Tech-Noir**: Aesthetic aligns with builder/hacker identity

## Support & Issues

For issues, open a GitHub issue with:
- Environment details
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## License

TBD
