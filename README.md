# RevenueForge

RevenueForge is a free, validation-first SaaS for technical builders. It combines an onboarding offer gate, an outreach gauntlet with a cumulative milestone ladder, project management, and Supabase auth into one workflow.

The product is intentionally opinionated:

- A user signs up.
- They must define their Buyer, Product, and Offer in one sentence.
- The sentence is graded by an LLM or mock grader.
- If the score is below 85, they rewrite it.
- If the score is 85 or higher, the project is created and they enter the gauntlet.
- They must log 5 outreach contacts before reaching the dashboard. Progress is cumulative — nothing resets.

## The Milestone Ladder

| Milestone | Requirement | Effect |
| --- | --- | --- |
| M1 · Forge the Offer | a project with `offer_score >= 85` | unlocks `/gauntlet` |
| M2 · First Sparks | 5 rows in `outreach_activities` | unlocks `/dashboard` |
| M3 · Conversations | 3 rows with `outcome IN ('reply','commitment')` | displayed progress only — no route gate |
| M4 · Proof of Demand | 1 row with `outcome = 'commitment'` | displayed progress only — no route gate |

Outreach outcomes only harden: `sent -> reply`, `sent -> commitment`, `reply -> commitment`. Downgrades are rejected.

## What’s Included

- Supabase authentication with signup and login
- Offer Gate onboarding flow at `/onboarding`
- Middleware-based routing enforcement
- Outreach gauntlet with the milestone ladder at `/gauntlet`
- Project dashboard with milestone and outreach stats at `/dashboard`
- Supabase RLS schema and RPC helpers
- Jest unit tests for the milestone math
- TypeScript + Next.js 15 app router structure

## App Flow

1. User signs up at `/auth/signup`.
2. New accounts are redirected to `/onboarding`.
3. The user submits a one-sentence offer.
4. The server grades the sentence.
5. Score below 85: red feedback and retry.
6. Score 85 or above: create the project and redirect to `/gauntlet`.
7. The middleware checks the user’s milestone gate.
8. When 5 outreach contacts are logged (M1 and M2 complete), the user reaches `/dashboard`.

## Tech Stack

- Next.js 15 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase for auth and Postgres
- Jest and ts-jest for testing

## Repository Structure

```text
app/
  actions.ts               Server actions for projects, outreach, and grading
  api/
    health/route.ts        Lightweight health check
  auth/
    login/page.tsx         Login form
    signup/page.tsx        Signup form
    layout.tsx             Auth-only layout
  dashboard/page.tsx       Project dashboard with milestone stats
  gauntlet/page.tsx        Outreach logging and milestone ladder
  onboarding/page.tsx      Offer Gate onboarding screen
  page.tsx                 Root redirect logic
  globals.css              Global styles
  layout.tsx               Root layout

components/
  ui/                      Shared UI primitives

lib/
  milestones.ts            Milestone math and outcome upgrade rules
  milestones.test.ts       Unit tests for the milestone math
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
- OpenAI, only if you want the real LLM grader instead of the built-in mock fallback

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

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
- `projects`
- `outreach_activities`
- RLS policies for all tables
- RPC functions for milestone gating, activity logging, and outcome upgrades

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

The gauntlet uses:

- `outreach_activities` for each logged contact, including its `outcome` (`sent`, `reply`, or `commitment`)
- the `check_milestone_gate` RPC to compute cumulative milestone state
- the `upgrade_outreach_outcome` RPC to harden an outcome (downgrades are rejected)

## Key Routes

- `/` redirects users based on auth, onboarding, and milestone state
- `/auth/signup` creates the user profile and sends them to onboarding
- `/onboarding` grades the offer sentence
- `/gauntlet` handles outreach logging and shows the milestone ladder
- `/dashboard` shows projects, milestone state, and outreach stats

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
3. Authenticated users with an approved project but fewer than 5 logged contacts go to `/gauntlet`
4. Users who passed both gates (M1 and M2) reach `/dashboard`

## Testing

Jest is installed and wired to `npm test`. Unit tests cover the milestone math in `lib/milestones.test.ts`.

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

## Troubleshooting

- If the app says Supabase credentials are missing, check `.env.local`.
- If onboarding fails, verify `OPENAI_API_KEY` or use the mock fallback.
- If dashboard access loops back to onboarding, make sure a project exists with `offer_score >= 85`.
- If the gauntlet loops back to login, verify auth cookies and Supabase session handling.

## Current Status

- Offer Gate onboarding is implemented
- Outreach gauntlet with the milestone ladder is implemented
- Dashboard with milestone stats and project management is implemented
- The product is free — there is no payment or plan machinery
