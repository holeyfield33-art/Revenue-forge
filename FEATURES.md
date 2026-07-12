# FEATURES.md

## RevenueForge Feature Roadmap

### Phase 0: Core MVP ✅ COMPLETE

This is the foundation - everything needed to enforce the gauntlet's milestone ladder and unlock the dashboard.

#### Implemented Features

**Authentication & User Management**

- [x] Email/Password authentication via Supabase
- [x] User signup with automatic profile creation
- [x] User login with session persistence
- [x] Logout functionality
- [x] Protected routes via middleware

**The Offer Gate (Onboarding)**

- [x] One-sentence Buyer/Product/Offer submission
- [x] LLM grading via OpenAI, with a mock fallback when no key is set
- [x] Score below 85 requires a rewrite
- [x] Score 85 or above creates the project and enters the gauntlet

**The Gauntlet (Milestone Ladder)**

- [x] Middleware that checks the milestone gate before dashboard access
- [x] Cumulative milestones — no daily reset:
  - M1 Forge the Offer: a project scored 85+
  - M2 First Sparks: 5 logged outreach contacts (unlocks the dashboard)
  - M3 Conversations: 3 replies (commitments count as replies)
  - M4 Proof of Demand: 1 commitment
- [x] Rapid-entry form for logging outreach contacts
- [x] Multi-platform support: Email, Twitter/X, LinkedIn, Other
- [x] Outcome per contact: sent, reply, or commitment
- [x] Upgrade-only outcome transitions (records only harden; downgrades rejected)
- [x] Optional notes field for each contact
- [x] Milestone ladder with live counts
- [x] Automatic redirect to dashboard when the gate opens

**Project Management**

- [x] Create projects during gauntlet
- [x] List projects on dashboard
- [x] Delete projects
- [x] Project status tracking (in_gauntlet, validated, dead)
- [x] GitHub URL linking

**Database & Security**

- [x] PostgreSQL schema with 3 core tables
- [x] Row-Level Security (RLS) for all tables
- [x] RPC function for milestone checking
- [x] RPC functions for logging activities and upgrading outcomes
- [x] Indexed queries for performance
- [x] Foreign key relationships

**UI/UX**

- [x] Tech-noir dark mode aesthetic
- [x] Zinc/black backgrounds with red accents
- [x] Responsive design for mobile/tablet/desktop
- [x] Milestone ladder visualization
- [x] Status badges (in_gauntlet, validated, dead)
- [x] Dialog modals for project creation
- [x] Error messaging
- [x] Loading states

**Testing**

- [x] Jest unit tests for the milestone math (`lib/milestones.test.ts`)

---

### Phase 1: Analytics & Insights

**Planned Features**

- [ ] Outreach count charts
- [ ] Contact conversion funnel
- [ ] Project status breakdown
- [ ] Top contact platforms (pie chart)
- [ ] Streak counter (consecutive days)
- [ ] Export outreach data (CSV)
- [ ] Analytics dashboard
- [ ] Weekly summary emails

**Estimated Timeline**: 2 weeks

---

### Phase 2: Team Collaboration

**Planned Features**

- [ ] Team workspaces
- [ ] Invite team members
- [ ] Role-based access (Owner, Editor, Viewer)
- [ ] Shared projects
- [ ] Activity log for audit trail
- [ ] Team dashboard with aggregated metrics
- [ ] Comment threads on projects
- [ ] @mentions for collaboration

**Estimated Timeline**: 3 weeks

---

### Phase 3: CRM Integration & Automations

**Planned Features**

- [ ] HubSpot integration
- [ ] Pipedrive integration
- [ ] Zapier integration
- [ ] Email template library
- [ ] Auto-logging from email (Gmail integration)
- [ ] LinkedIn automated suggestions
- [ ] Reminder notifications
- [ ] Workflow automation

**Estimated Timeline**: 3 weeks

---

### Phase 4: Mobile App

**Planned Features**

- [ ] iOS native app
- [ ] Android native app
- [ ] Offline-first sync
- [ ] Push notifications
- [ ] Quick contact logging
- [ ] Dashboard overview
- [ ] Project details view

**Estimated Timeline**: 4 weeks

---

### Phase 5: Advanced Features

**Planned Features**

- [ ] AI-powered outreach suggestions
- [ ] Contact quality scoring
- [ ] Lead scoring algorithm
- [ ] Predictive analytics
- [ ] Custom gauntlet rules per project
- [ ] A/B testing for outreach
- [ ] SEO/SEM tracking
- [ ] Competitor monitoring

**Estimated Timeline**: Ongoing

---

## Technical Debt & Improvements

### Code Quality

- [ ] Expand the test suite beyond milestone math (React Testing Library)
- [ ] Add E2E tests (Cypress)
- [ ] Add Storybook for component documentation
- [ ] Improve error boundaries
- [ ] Wire up project editing on the dashboard (button is currently a stub)

### Performance

- [ ] Implement database connection pooling
- [ ] Add Redis caching layer
- [ ] Optimize images (next/image)
- [ ] Implement pagination for large datasets
- [ ] Add query debouncing

### DevOps

- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add staging environment
- [ ] Implement monitoring (DataDog/Sentry)
- [ ] Add database backup automation
- [ ] Configure rate limiting
- [ ] Set up WAF rules

### UX/Design

- [ ] Implement tour guide
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (WCAG 2.1 AA)
- [ ] Dark mode toggle
- [ ] Custom color themes

### Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture decision records (ADRs)
- [ ] Video tutorials
- [ ] Blog posts

---

## Feature Requests & Community Ideas

### From Users

- [ ] Calendar view of outreach
- [ ] Bulk import from CSV
- [ ] Slack notifications
- [ ] Discord bot integration
- [ ] Webhook support for custom integrations
- [ ] White-label option for agencies
- [ ] Custom domain support

### Product Ideas

- [ ] Gauntlet challenges (seasonal)
- [ ] Leaderboards
- [ ] Social proof/public profiles
- [ ] Public API
- [ ] Plugin marketplace
- [ ] Community forum

---

## Known Limitations (Phase 0)

1. **Single User Only**: Team features in Phase 2
2. **No Analytics**: Coming in Phase 1
3. **Manual Project Creation**: Auto-sync in Phase 3
4. **No Mobile App**: Native apps in Phase 4
5. **No Notifications**: Email/push in Phase 3-4
6. **No Export**: Coming in Phase 1
7. **No Project Editing**: Dashboard edit button is a stub

---

## Feature Status Legend

| Status      | Symbol | Meaning                 |
| ----------- | ------ | ----------------------- |
| Implemented | ✅     | Done and tested         |
| In Progress | 🚀     | Currently building      |
| Planned     | 📋     | Next up                 |
| Proposed    | 💡     | Under consideration     |
| Blocked     | 🚫     | Waiting on dependencies |
| Deprecated  | ⛔     | No longer supported     |

---

## How to Request Features

1. Open a GitHub issue with the title: `[Feature Request] Your idea`
2. Describe the use case
3. Explain the benefit to other users
4. Add examples or mockups if possible
5. React with 👍 to existing requests you support

---

## Roadmap Updates

Check back monthly for updated timelines and progress on current phases.

Last Updated: July 2026
