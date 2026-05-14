# RevenueForge

RevenueForge is a validation-first SaaS for technical builders. It combines an onboarding offer gate, a daily outreach gauntlet, project management, Supabase auth, and Stripe-ready billing scaffolding into one workflow.

The product is intentionally opinionated:

- A user signs up.
- They must define their Buyer, Product, and Offer in one sentence.
- The sentence is graded by an LLM or mock grader.
- If the score is below 85, they rewrite it.
- If the score is 85 or higher, the project is created and they enter the gauntlet.
- They must complete the daily outreach quota before reaching the dashboard.

## What’s Included

- Supabase authentication with signup and login
- Offer Gate onboarding flow at `/onboarding`
- Middleware-based routing enforcement
- Daily outreach gauntlet at `/gauntlet`
- Project dashboard at `/dashboard`
- Supabase RLS schema and RPC helpers
- Stripe webhook scaffold for later billing work
- Jest testing framework setup
- TypeScript + Next.js 15 app router structure

## App Flow

1. User signs up at `/auth/signup`.
2. New accounts are redirected to `/onboarding`.
3. The user submits a one-sentence offer.
4. The server grades the sentence.
5. Score below 85: red feedback and retry.
6. Score 85 or above: create the project and redirect to `/gauntlet`.
7. The middleware checks the user’s daily outreach gate.
8. When outreach quota is complete, the user reaches `/dashboard`.

## Tech Stack

- Next.js 15 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase for auth and Postgres
- Stripe integration scaffold
- Jest and ts-jest for testing

## Repository Structure

```text
app/
  actions.ts               Server actions for projects, outreach, and grading
  api/
    health/route.ts        Lightweight health check
    webhooks/stripe/       Stripe webhook endpoint scaffold
  auth/
    login/page.tsx         Login form
    signup/page.tsx        Signup form
    layout.tsx             Auth-only layout
  dashboard/page.tsx       Project dashboard
  gauntlet/page.tsx        Daily outreach gate
  onboarding/page.tsx      Offer Gate onboarding screen
  page.tsx                 Root redirect logic
  globals.css              Global styles
  layout.tsx               Root layout

components/
  ui/                      Shared UI primitives

lib/
  supabase/
    client.ts              Browser client helper
    server.ts              Server client helper
    schema.sql             Database schema, policies, and RPC functions
  types/
    database.ts            Shared database types
  utils.ts                 Shared utility helpers

middleware.ts               Route enforcement and gate logic
```

## Required Accounts

You need accounts for the services below:

- Supabase
- Stripe
- OpenAI, only if you want the real LLM grader instead of the built-in mock fallback

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Stripe

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### App

- `NEXT_PUBLIC_APP_URL`

### Optional AI Grader

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

```bash
cp .env.local.example .env.local
```

Then set your values in `.env.local`.

### 3. Apply the Database Schema

Open the Supabase SQL editor and run the full contents of `lib/supabase/schema.sql`.

That schema creates:

- `profiles`
- `daily_quota_logs`
- `projects`
- `outreach_activities`
- RLS policies for all tables
- RPC functions for outreach gating and activity logging

### 4. Enable Supabase Auth

In Supabase, go to Authentication and make sure email/password sign-in is enabled.

### 5. Start the Dev Server

```bash
npm run dev
```

Open `http://localhost:3000`.

## Database Notes

The `projects` table stores the onboarding offer gate fields:

- `offer_sentence` for the one-sentence pitch
- `offer_score` for the LLM or mock grade

The daily outreach gauntlet still uses:

- `profiles` for user tier and quota data
- `daily_quota_logs` for daily progress
- `outreach_activities` for each logged contact

## Key Routes

- `/` redirects users based on auth, onboarding, and outreach state
- `/auth/signup` creates the user profile and sends them to onboarding
- `/onboarding` grades the offer sentence
- `/gauntlet` handles daily outreach logging
- `/dashboard` shows projects and unlocked status

## Offer Gate Behavior

The onboarding page sends the sentence to `gradeOffer` in `app/actions.ts`.

If an `OPENAI_API_KEY` is present, the app calls the OpenAI chat completions API with a strict JSON response format. If no key is available, it falls back to a mock score between 70 and 95.

Rules:

- Score below 85: show harsh feedback and require a rewrite
- Score 85 or above: create the project and continue to the gauntlet

## Middleware Behavior

`middleware.ts` enforces the route order:

1. Unauthenticated users go to `/auth/login`
2. Authenticated users without an approved project go to `/onboarding`
3. Authenticated users with an approved project but incomplete daily outreach go to `/gauntlet`
4. Users who passed both gates reach `/dashboard`

## Testing

Jest is installed and wired to `npm test`.

Run tests with:

```bash
npm test
```

Run TypeScript checks with:

```bash
npx tsc --noEmit
```

## Deployment

### Coolify or Render

1. Connect the GitHub repository.
2. Set all environment variables from this README.
3. Point `NEXT_PUBLIC_APP_URL` at your deployed URL.
4. Apply the Supabase schema to your production project.
5. Deploy the app.

### Stripe Webhook

If you enable billing later, point your Stripe webhook at `/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.

## Troubleshooting

- If the app says Supabase credentials are missing, check `.env.local`.
- If onboarding fails, verify `OPENAI_API_KEY` or use the mock fallback.
- If dashboard access loops back to onboarding, make sure a project exists with `offer_score >= 85`.
- If the gauntlet loops back to login, verify auth cookies and Supabase session handling.

## Current Status

- Offer Gate onboarding is implemented
- Daily outreach gauntlet is implemented
- Dashboard and project management are implemented
- Stripe webhook is intentionally a scaffold endpoint for now
