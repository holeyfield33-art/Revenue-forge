# API_REFERENCE.md

## RevenueForge API Reference

### Server Actions (Next.js)

All server actions are defined in `app/actions.ts` and use the `'use server'` directive.

#### logOutreachActivity

Logs an outreach contact and returns the updated milestone state.

**Type**: `Server Action`

**Parameters**:
```typescript
interface LogOutreachInput {
  projectId: string;              // UUID of the project
  platform: 'email' | 'twitter' | 'linkedin' | 'other';
  contactInfo: string;            // Email, handle, URL, etc.
  outcome?: 'sent' | 'reply' | 'commitment';  // Defaults to 'sent'
  notes?: string;                 // Optional notes about contact
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    activity_id: string;          // UUID of created activity
    m1: boolean;                  // Offer scored 85+
    m2: boolean;                  // 5 contacts logged
    m3: boolean;                  // 3 replies
    m4: boolean;                  // 1 commitment
    sent: number;                 // Total contacts logged
    replies: number;              // Replies (commitments included)
    commitments: number;          // Commitments
    dashboard_unlocked: boolean;  // m1 AND m2
  };
  error?: string;                 // Error message if failed
}
```

**Example**:
```typescript
const result = await logOutreachActivity({
  projectId: '550e8400-e29b-41d4-a716-446655440000',
  platform: 'email',
  contactInfo: 'founder@company.com',
  notes: 'Interested in demo'
});

if (result.success) {
  console.log(`Logged contact ${result.data.sent} of 5.`);
}
```

---

#### checkMilestoneStatus

Checks the user's current milestone state.

**Type**: `Server Action`

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    m1: boolean;                  // Offer scored 85+
    m2: boolean;                  // 5 contacts logged
    m3: boolean;                  // 3 replies
    m4: boolean;                  // 1 commitment
    sent: number;                 // Total contacts logged
    replies: number;              // Replies (commitments included)
    commitments: number;          // Commitments
    dashboard_unlocked: boolean;  // m1 AND m2
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await checkMilestoneStatus();
if (result.data?.dashboard_unlocked) {
  router.push('/dashboard');
}
```

---

#### upgradeOutreachOutcome

Upgrades a logged contact's outcome. Records only harden — allowed transitions are
`sent -> reply`, `sent -> commitment`, and `reply -> commitment`. Downgrades are rejected.

**Type**: `Server Action`

**Parameters**:
```typescript
upgradeOutreachOutcome(
  activityId: string,             // UUID of the outreach activity
  outcome: 'reply' | 'commitment'
)
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    success: boolean;
    outcome?: string;             // The new outcome
    error?: string;               // Rejection reason
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await upgradeOutreachOutcome(activityId, 'reply');
if (result.error) {
  setError(result.error); // e.g. downgrade rejected
}
```

---

#### getOutreachActivities

Fetches all outreach activities for the current user, newest first.

**Type**: `Server Action`

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean;
  data?: OutreachActivity[];
  error?: string;
}
```

---

#### getProjects

Fetches all projects for the current user.

**Type**: `Server Action`

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean;
  data?: Project[];
  error?: string;
}
```

**Project Structure**:
```typescript
interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  github_url?: string;
  offer_sentence?: string;
  offer_score: number;
  status: 'in_gauntlet' | 'validated' | 'dead';
  gauntlet_start_date: string;  // ISO timestamp
  created_at: string;
  updated_at: string;
}
```

**Example**:
```typescript
const result = await getProjects();
if (result.success) {
  result.data?.forEach(project => {
    console.log(`${project.name}: ${project.status}`);
  });
}
```

---

#### createProject

Creates a new project.

**Type**: `Server Action`

**Parameters**:
```typescript
interface CreateProjectInput {
  name: string;                  // Required
  description?: string;
  github_url?: string;
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: Project;
  error?: string;
}
```

**Example**:
```typescript
const result = await createProject({
  name: 'My SaaS',
  description: 'B2B scheduling tool',
  github_url: 'https://github.com/user/my-saas'
});

if (result.success) {
  setProjects([...projects, result.data]);
}
```

---

#### updateProject

Updates an existing project.

**Type**: `Server Action`

**Parameters**:
```typescript
updateProject(
  projectId: string,            // UUID
  updates: {
    name?: string;
    description?: string;
    github_url?: string;
    status?: 'in_gauntlet' | 'validated' | 'dead';
  }
)
```

**Returns**:
```typescript
{
  success: boolean;
  data?: Project;
  error?: string;
}
```

**Example**:
```typescript
const result = await updateProject(projectId, {
  status: 'validated'
});
```

---

#### deleteProject

Deletes a project and all associated outreach activities.

**Type**: `Server Action`

**Parameters**:
```typescript
deleteProject(projectId: string)
```

**Returns**:
```typescript
{
  success: boolean;
  error?: string;
}
```

**Example**:
```typescript
const result = await deleteProject(projectId);
if (result.success) {
  setProjects(projects.filter(p => p.id !== projectId));
}
```

---

#### gradeOffer

Grades a one-sentence Buyer/Product/Offer statement. Uses the OpenAI API when
`OPENAI_API_KEY` is set, otherwise a mock grader. A score of 85 or above creates
the project.

**Type**: `Server Action`

**Parameters**:
```typescript
gradeOffer(sentence: string)
```

**Returns**:
```typescript
{
  score: number;                 // 0-100
  feedback: string;              // Critique or "Clear to proceed"
  qualified: boolean;            // score >= 85
  projectId?: string;            // Created project when qualified
  error?: string;
}
```

---

### Database RPC Functions

RPC functions execute on the database side for performance and security.

#### check_milestone_gate

Computes the user's cumulative milestone state.

**Type**: Supabase RPC

**Function Signature**:
```sql
check_milestone_gate(user_id_param UUID)
RETURNS JSON
```

**Returns**:
```json
{
  "m1": boolean,
  "m2": boolean,
  "m3": boolean,
  "m4": boolean,
  "sent": number,
  "replies": number,
  "commitments": number,
  "dashboard_unlocked": boolean
}
```

`replies` counts activities with `outcome IN ('reply', 'commitment')`.
`dashboard_unlocked` is `m1 AND m2`.

**Example (Client)**:
```typescript
const { data, error } = await supabase
  .rpc('check_milestone_gate', {
    user_id_param: 'user-uuid'
  });
```

**Use Cases**:
- Middleware gate checking
- Dashboard milestone display
- Gauntlet redirect logic

---

#### log_outreach_activity

Logs an outreach contact and returns the updated milestone state.

**Type**: Supabase RPC

**Function Signature**:
```sql
log_outreach_activity(
  user_id_param UUID,
  project_id_param UUID,
  platform_param TEXT,
  contact_info_param TEXT,
  notes_param TEXT DEFAULT NULL,
  outcome_param TEXT DEFAULT 'sent'
)
RETURNS JSON
```

**Parameters**:
- `user_id_param`: User's UUID (from auth.users)
- `project_id_param`: Project UUID
- `platform_param`: 'email' | 'twitter' | 'linkedin' | 'other'
- `contact_info_param`: Contact details (email, handle, etc.)
- `notes_param`: Optional notes
- `outcome_param`: 'sent' | 'reply' | 'commitment' (defaults to 'sent')

**Returns**: The `check_milestone_gate` payload plus `activity_id`.

**Side Effects**:
- Creates row in `outreach_activities`

---

#### upgrade_outreach_outcome

Hardens an activity's outcome. Allowed transitions: `sent -> reply`,
`sent -> commitment`, `reply -> commitment`. Anything else is rejected.
Runs with invoker rights, so RLS restricts it to the caller's own activities.

**Type**: Supabase RPC

**Function Signature**:
```sql
upgrade_outreach_outcome(
  activity_id_param UUID,
  outcome_param TEXT
)
RETURNS JSON
```

**Returns**:
```json
{
  "success": boolean,
  "outcome": "string (on success)",
  "error": "string (on rejection)"
}
```

---

### REST API Routes

#### GET /api/health

Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "message": "RevenueForge API"
}
```

---

### Middleware API

#### Milestone Gate Middleware

Enforces the milestone gate on all requests to protected routes.

**Protected Routes**:
- `/onboarding` (if an approved project exists, continues down the flow)
- `/gauntlet` (if the dashboard is already unlocked, redirects to dashboard)
- `/dashboard` (if the gate is closed, redirects to gauntlet)

**Flow**:
1. Check if user is authenticated
2. Check for a project with `offer_score >= 85` (M1)
3. Call `check_milestone_gate` RPC
4. Route based on `dashboard_unlocked`
5. Redirect if necessary

**Logic**:
```typescript
if (gateStatus && !gateStatus.dashboard_unlocked) {
  if (path !== '/gauntlet') {
    return NextResponse.redirect(new URL('/gauntlet', request.url));
  }
  return response;
}

if (path !== '/dashboard') {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

## Error Handling

### Common Error Responses

**Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**Validation Error**:
```json
{
  "error": "Please select a project and enter contact information"
}
```

**Database Error**:
```json
{
  "error": "Failed to log outreach activity"
}
```

### Client Error Handling Pattern

```typescript
const result = await someAction();

if (result.error) {
  setError(result.error);
  // Show error UI
  return;
}

// Handle success
console.log(result.data);
```

---

## Rate Limiting

### Current Limits (Phase 0)
- No rate limiting implemented

### Planned (Phase 1+)
- 100 requests per minute per user
- 10,000 requests per day per user

---

## Authentication

### Session Management

Sessions are managed by Supabase Auth:
- JWT tokens in httpOnly cookies
- Automatic token refresh
- Middleware validates session

### Protected Endpoints

All Server Actions check:
```typescript
const {data: {user}} = await supabase.auth.getUser();
if (!user) return {error: 'Unauthorized'};
```

---

## Data Types

See `lib/types/database.ts` and `lib/milestones.ts` for TypeScript definitions:

- `Profile`: User account record
- `Project`: Builder project/idea with offer fields
- `OutreachActivity`: Individual contact record with outcome
- `OutreachOutcome`: 'sent' | 'reply' | 'commitment'
- `MilestoneState`: Computed ladder state (m1-m4, counts, dashboard_unlocked)

---

## Changelog

### v0.2.0 (July 2026)
- Free release
- Replaced the daily-outreach quota with the cumulative milestone ladder
- Added outreach outcomes with upgrade-only transitions

### v0.1.0 (May 2026)
- Initial MVP release
- Core gauntlet enforcement
- Project management
- Supabase integration

---

## Support

For API issues:
- Check `SETUP_GUIDE.md` for common problems
- Review browser console for errors
- Check Supabase logs in dashboard
- Open GitHub issue with details

---

Last Updated: July 2026
