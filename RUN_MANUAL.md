# RUN_MANUAL.md

## RevenueForge — Complete Run Manual

This is the single source of truth for running, testing, and deploying
RevenueForge. It supersedes scattered instructions in README.md,
SETUP_GUIDE.md, QUICKSTART.md, and DEPLOYMENT.md where they conflict —
those files are kept for narrative walkthroughs, but the tables below are
current as of this audit (July 2026, `@supabase/ssr` auth rewrite).

---

## 1. Requirements

- Node.js 18+ (Next.js 15 / React 19 requirement)
- npm (repo ships a `package-lock.json`)
- A Supabase project (free tier is sufficient)
- Optional: an OpenAI API key, only if you want real LLM grading instead of
  the mock grader

---

## 2. Dependencies

### Runtime (`dependencies`)

| Package                     | Version  | Purpose                                            |
| ---------------------------- | -------- | --------------------------------------------------- |
| `next`                      | ^15.0.0  | App framework (App Router, Server Actions, middleware) |
| `react` / `react-dom`       | ^19.0.0  | UI runtime                                          |
| `@supabase/supabase-js`     | ^2.39.0  | Supabase SDK (queries, RPC calls)                   |
| `@supabase/ssr`             | ^0.12.3  | Cookie-backed Supabase sessions for SSR/middleware — **added in this audit; see Section 8** |
| `@radix-ui/react-dialog`    | ^1.1.1   | Dialog primitive (project creation modals)           |
| `@radix-ui/react-label`     | ^2.1.8   | Label primitive                                     |
| `@radix-ui/react-slot`      | ^1.2.4   | Slot primitive used by `Button`/`cn` composition     |
| `class-variance-authority`  | ^0.7.0   | Variant styling for UI components                   |
| `clsx` / `tailwind-merge`   | ^2.0.0 / ^2.2.0 | Class name composition                       |
| `lucide-react`              | ^0.468.0 | Icons                                                |
| `tailwindcss-animate`       | ^1.0.6   | Tailwind animation utilities                        |

### Dev (`devDependencies`)

| Package                                            | Purpose                          |
| --------------------------------------------------- | --------------------------------- |
| `typescript`, `@types/node`, `@types/react`, `@types/react-dom` | Type checking |
| `jest`, `ts-jest`, `@types/jest`, `ts-node`         | Unit test runner                 |
| `eslint`, `@eslint/js`, `@typescript-eslint/*`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-prettier`, `eslint-config-prettier` | Linting/formatting |
| `tailwindcss`, `postcss`, `autoprefixer`            | CSS build pipeline               |

Install everything with:

```bash
npm install
```

---

## 3. Environment Variables

Copy the template and fill in real values:

```bash
cp .env.local.example .env.local
```

| Variable                         | Required?     | Used where                                  | Notes |
| --------------------------------- | -------------- | -------------------------------------------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL`       | **Required**   | `lib/supabase/client.ts`, `lib/supabase/server.ts`, `middleware.ts` | Project URL from Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | **Required**   | Same as above                                | Anon/public key — safe to expose client-side because RLS enforces access |
| `OPENAI_API_KEY`                 | Optional       | `app/actions.ts` (`gradeOffer`)             | Enables real LLM grading. Without it, `lib/gradeOfferHeuristic.ts` grades deterministically against the same Buyer/Product/Offer rubric instead of the old random 70–95 fallback — see Section 8 |
| `OPENAI_MODEL`                   | Optional       | `app/actions.ts`                            | Defaults to `gpt-4o-mini` if unset |
| `SUPABASE_SERVICE_ROLE_KEY`      | **Not currently used** | Nowhere in the code today          | Present in `.env.local.example` and every doc's "required" list, but no file reads `process.env.SUPABASE_SERVICE_ROLE_KEY`. Keep it out of any client-exposed context if you do wire it up later — it bypasses RLS entirely |
| `NEXT_PUBLIC_APP_URL`            | **Not currently used** | Nowhere in the code today          | Same situation — dead config. The signup page now builds its redirect URL from `window.location.origin` instead |

**Action item**: decide whether to actually wire up `SUPABASE_SERVICE_ROLE_KEY` /
`NEXT_PUBLIC_APP_URL` for a real use case, or drop them from the docs so
nobody wastes setup time chasing a var the app never reads.

---

## 4. Database Setup

1. Create a Supabase project.
2. Open the SQL Editor and run the **entire** contents of
   `lib/supabase/schema.sql`. This creates:
   - `profiles`, `projects`, `outreach_activities`
   - RLS policies on all three tables
   - RPC functions: `check_milestone_gate`, `log_outreach_activity`,
     `upgrade_outreach_outcome`
3. Go to Authentication → Providers and confirm Email/Password is enabled.
4. Go to Authentication → URL Configuration and set:
   - **Site URL**: your app's base URL (`http://localhost:3000` for dev)
   - **Redirect URLs**: add `<site-url>/auth/callback` — this route now
     exists (`app/auth/callback/route.ts`, added in this audit) and
     exchanges Supabase's confirmation-link code for a real session.
5. Decide on **Confirm email**: if you leave Supabase's default (email
   confirmation required), a new signup will see a "check your email"
   screen instead of dropping straight into onboarding. If you want the
   frictionless "sign up → immediately in the product" flow described in
   the quickstart docs, turn **Confirm email** off in Authentication →
   Providers → Email.

### Migration note for existing deployments

If you already ran an older copy of `schema.sql` before this audit, apply
just this statement — it was missing and silently broke profile-row
creation on signup:

```sql
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 5. Running Locally

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase values
npm run dev
```

Open `http://localhost:3000`.

### Manual smoke test (golden path)

1. `/auth/signup` → create an account.
   - If email confirmation is on: you'll see "Confirm Your Email" — check
     your inbox, click the link, you land back on `/onboarding` with a
     session.
   - If it's off: you go straight to `/onboarding`.
2. Submit a one-sentence Buyer/Product/Offer. Score 85+ auto-creates a
   project and takes you to `/gauntlet`. Below 85, you get harsh feedback
   and rewrite.
3. On `/gauntlet`, log 5 outreach contacts (any platform/outcome). On the
   5th, you're redirected to `/dashboard`.
4. On `/dashboard`, confirm the milestone ladder shows M1/M2 achieved and
   your project is listed.
5. Back on `/gauntlet` (or via the dashboard), upgrade a contact's outcome
   to "reply" or "commitment" and confirm downgrades are rejected.
6. Log out from the dashboard and confirm you're bounced back to
   `/auth/login`, and that hitting `/dashboard` directly while logged out
   redirects to login (this is the exact path that was broken before this
   audit — see Section 8).

---

## 6. Testing

```bash
npm test              # Jest unit tests
npx tsc --noEmit       # TypeScript check
npm run lint           # ESLint (warnings only, no errors, on a clean tree)
npm run build          # Production build
```

Current suite (after this audit): **4 test files, 24 tests, all pure-function
unit tests** (no live Supabase needed to run them):

| File                                   | Covers |
| ---------------------------------------- | ------ |
| `lib/milestones.test.ts` (pre-existing)  | Milestone math, outcome-upgrade rules |
| `lib/validateOfferSentence.test.ts` (new)| Empty/whitespace rejection, max-length boundary (500 chars) |
| `lib/routes.test.ts` (new)               | The exact route-gating predicate `middleware.ts` uses — the security boundary that was silently broken before this audit now has a direct test |
| `app/api/health/route.test.ts` (new)     | Health check contract |

**What's still untested** (would need a mocked/live Supabase client and
realistically belongs in an E2E suite, not Jest unit tests):

- `app/actions.ts` server actions (`gradeOffer`, `logOutreachActivity`,
  `createProject`, etc.) — all depend on a live Supabase session
- `middleware.ts` end-to-end redirect behavior — the pure predicate is
  tested, but the actual Supabase-backed gating logic is not
- Full signup → onboarding → gauntlet → dashboard flow

Recommendation: add a Playwright/Cypress E2E suite against a seeded
Supabase test project before scaling past a handful of users. Not done in
this pass — it requires a live database and is a different class of test
than the Jest unit suite.

---

## 7. Deployment

### Vercel (recommended)

1. Push to GitHub, import the repo in Vercel.
2. Add all env vars from Section 3.
3. Deploy. Vercel auto-detects Next.js.
4. Update Supabase Auth URL Configuration to point at the Vercel URL
   (Site URL + `/auth/callback` redirect URL).

### Render / Coolify / Docker

See `DEPLOYMENT.md` for platform-specific steps — the build/start commands
(`npm run build` / `npm start`) and env vars are unchanged by this audit.

### Post-deploy checklist

- [ ] Visit the deployed URL — root should redirect to `/auth/login`
- [ ] Signup → confirmation email → callback → onboarding works end-to-end
- [ ] Login → dashboard redirect logic matches milestone state
- [ ] `/api/health` returns `{"status":"ok", ...}`
- [ ] No `sb-auth-token` cookie references anywhere (that cookie name no
      longer exists in the codebase — see Section 8)

---

## 8. What Changed In This Audit (Summary)

See the full red-team report for details. In short, these were fixed:

1. **Critical — total auth breakage**: the client stored sessions via
   `@supabase/supabase-js`'s default (browser localStorage), while
   `middleware.ts` and `lib/supabase/server.ts` looked for a cookie
   (`sb-auth-token`) that nothing ever set. Every server-rendered page and
   server action saw a logged-out user; middleware bounced every
   just-logged-in user back to `/auth/login`. Fixed by moving both the
   browser and server Supabase clients to `@supabase/ssr`
   (`createBrowserClient` / `createServerClient`), which keeps client and
   server in sync via real cookies.
2. **Critical — middleware fail-open**: on any RPC/query exception inside
   the gate-check block, the old middleware caught the error and let the
   request through unchecked, bypassing the milestone gate entirely. Now
   fails closed (redirects to `/onboarding` on error).
3. **Missing RLS policy**: `profiles` had no `INSERT` policy, so the
   client-side profile-row insert on signup silently failed under RLS
   every time. Added the policy to `schema.sql`.
4. **Dead "+ New Project" button in the Gauntlet**: the dialog's Create
   button was a stub that closed the dialog without calling any server
   action. Wired to the real `createProject` action.
5. **Dead "Edit" button on the dashboard**: previously a silent no-op.
   Now disabled with a "coming soon" affordance instead of lying about
   functionality.
6. **No auth callback route**: Supabase's email-confirmation/magic-link
   redirect requires exchanging a `code` for a session. Added
   `app/auth/callback/route.ts`; updated the signup page to show a
   "check your email" state instead of redirecting into a session-less
   dead end.
7. **Unbounded offer-sentence input**: `gradeOffer` had no length cap
   before forwarding user text to the OpenAI API — a cost/abuse vector on
   a free, unauthenticated-cost server action. Added a 500-character cap
   (`lib/validateOfferSentence.ts`, tested).
8. **Mock grader was a coin flip**: without `OPENAI_API_KEY`, every offer
   was scored by `Math.random()` over 70–95 — roughly 42% passed
   regardless of content, on a product whose entire pitch is a "ruthless"
   quality gate. Replaced with `lib/gradeOfferHeuristic.ts`, a
   deterministic scorer that checks for the same Buyer/Product/Offer
   signals the OpenAI rubric asks for (specific buyer vs. generic
   catch-all, a concrete product noun vs. buzzwords, a measurable outcome
   vs. a vague verb, a multi-sentence penalty). `gradeOffer` now returns
   which grader ran (`graderMode: "llm" | "heuristic"`), and the
   onboarding page shows a small note when the heuristic produced the
   score instead of silently passing it off as the real thing.

Full details, severity ratings, and what's still open: see the red-team
findings delivered alongside this manual.
