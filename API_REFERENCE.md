# API_REFERENCE.md

## RevenueForge API Reference

### Server Actions (Next.js)

All server actions are defined in `app/actions.ts` and use the `'use server'` directive.

#### logOutreachActivity

Logs an outreach contact and increments the daily quota.

**Type**: `Server Action`

**Parameters**:
```typescript
interface LogOutreachInput {
  projectId: string;              // UUID of the project
  platform: 'email' | 'twitter' | 'linkedin' | 'other';
  contactInfo: string;            // Email, handle, URL, etc.
  notes?: string;                 // Optional notes about contact
}
```

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    activity_id: string;          // UUID of created activity
    today_count: number;          // Updated count for today
    quota_met: boolean;           // Is daily quota met?
    remaining: number;            // Contacts remaining today
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
  console.log(`Logged contact. ${result.data.remaining} remaining.`);
}
```

---

#### checkQuotaStatus

Checks the user's current quota status.

**Type**: `Server Action`

**Parameters**: None

**Returns**:
```typescript
{
  success: boolean;
  data?: {
    quota_met: boolean;           // Has daily quota been met?
    daily_quota: number;          // Total quota for the day
    today_count: number;          // Contacts logged today
    remaining: number;            // Contacts remaining
  };
  error?: string;
}
```

**Example**:
```typescript
const result = await checkQuotaStatus();
if (result.data?.quota_met) {
  router.push('/dashboard');
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

### Database RPC Functions

RPC functions execute on the database side for performance and security.

#### check_outreach_gate

Checks if a user has completed their daily outreach quota.

**Type**: Supabase RPC

**Function Signature**:
```sql
check_outreach_gate(user_id_param UUID)
RETURNS JSON
```

**Returns**:
```json
{
  "quota_met": boolean,
  "daily_quota": number,
  "today_count": number,
  "remaining": number
}
```

**Example (Client)**:
```typescript
const { data, error } = await supabase
  .rpc('check_outreach_gate', {
    user_id_param: 'user-uuid'
  });
```

**Use Cases**:
- Middleware quota checking
- Dashboard quota status display
- Gauntlet redirect logic

---

#### log_outreach_activity

Logs an outreach contact and updates daily quota.

**Type**: Supabase RPC

**Function Signature**:
```sql
log_outreach_activity(
  user_id_param UUID,
  project_id_param UUID,
  platform_param TEXT,
  contact_info_param TEXT,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSON
```

**Parameters**:
- `user_id_param`: User's UUID (from auth.users)
- `project_id_param`: Project UUID
- `platform_param`: 'email' | 'twitter' | 'linkedin' | 'other'
- `contact_info_param`: Contact details (email, handle, etc.)
- `notes_param`: Optional notes

**Returns**:
```json
{
  "activity_id": "string",
  "today_count": number,
  "quota_met": boolean,
  "remaining": number
}
```

**Example (Client)**:
```typescript
const { data, error } = await supabase
  .rpc('log_outreach_activity', {
    user_id_param: userId,
    project_id_param: projectId,
    platform_param: 'email',
    contact_info_param: 'user@example.com',
    notes_param: 'Founder interested'
  });
```

**Side Effects**:
- Creates row in `outreach_activities`
- Updates/creates row in `daily_quota_logs`
- Increments `outreach_count` for today

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

#### POST /api/webhooks/stripe

Stripe webhook handler for payment events.

**Headers Required**:
```
Content-Type: application/json
Stripe-Signature: <signature>
```

**Event Types Handled**:
- `checkout.session.completed` - Upgrade to paid tier
- `customer.subscription.deleted` - Downgrade to free

**Response**:
```json
{
  "received": true
}
```

---

### Middleware API

#### Quota Gate Middleware

Enforces the daily quota check on all requests.

**Protected Routes**:
- `/gauntlet` (if quota already met, redirects to dashboard)
- `/dashboard` (if quota not met, redirects to gauntlet)

**Flow**:
1. Check if user is authenticated
2. Call `check_outreach_gate` RPC
3. Route based on `quota_met` status
4. Redirect if necessary

**Logic**:
```typescript
if (!quotaStatus.quota_met && path !== '/gauntlet') {
  return NextResponse.redirect(new URL('/gauntlet', request.url));
}

if (quotaStatus.quota_met && path === '/gauntlet') {
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
- Stripe API rate limiting

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

See `lib/types/database.ts` for TypeScript definitions:

- `UserTier`: 'free' | 'pro' | 'max'
- `Profile`: User account with tier
- `DailyQuotaLog`: Daily activity tracking
- `Project`: Builder project/idea
- `OutreachActivity`: Individual contact record

---

## Changelog

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

Last Updated: May 2026
