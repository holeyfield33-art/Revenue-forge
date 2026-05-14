# CONTRIBUTING.md

## Contributing to RevenueForge

Thanks for your interest in contributing! Here's how to help.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork
3. **Create** a feature branch: `git checkout -b feature/your-feature`
4. **Setup** development environment (see SETUP_GUIDE.md)
5. **Make** your changes
6. **Test** thoroughly
7. **Commit** with clear messages
8. **Push** to your fork
9. **Create** a Pull Request

## Development Workflow

### Branch Naming

```
feature/add-user-profile       # New feature
bugfix/quota-calculation       # Bug fix
docs/update-api-reference      # Documentation
refactor/simplify-middleware   # Code improvement
test/add-unit-tests           # Tests
```

### Commit Messages

```bash
# Good
git commit -m "feat: add stripe integration"
git commit -m "fix: correct quota gate logic for edge case"
git commit -m "docs: update SETUP_GUIDE.md"

# Bad
git commit -m "stuff"
git commit -m "fixes"
git commit -m "ugh"
```

### Code Style

```bash
# Format code
npm run lint

# TypeScript check
npx tsc --noEmit

# Check for console logs
grep -r "console.log" app/ --exclude-dir=node_modules
```

## File Organization

**Always maintain structure:**
```
app/feature-name/
├── page.tsx              # Main component
├── layout.tsx            # If nested routes
└── actions.ts            # Server actions (if needed)

components/
├── ui/                   # Shadcn components
└── feature-name/         # Feature components

lib/
├── supabase/             # Supabase clients
├── types/                # TypeScript types
└── utils/                # Utilities
```

## Testing Checklist

Before submitting PR:

- [ ] All features tested locally
- [ ] No console errors
- [ ] No broken links
- [ ] Middleware still works
- [ ] Database queries optimized
- [ ] RLS policies still correct
- [ ] TypeScript compiles
- [ ] No console.logs left
- [ ] Mobile responsive
- [ ] Accessibility checked

### Manual Testing

```bash
# 1. Test authentication
# - Signup works
# - Login works
# - Logout works

# 2. Test gauntlet
# - Create project
# - Log 5 contacts
# - Redirect to dashboard

# 3. Test dashboard
# - Create project
# - Edit project
# - Delete project

# 4. Test quota reset
# Manually update DB and test
```

## Pull Request Process

### PR Title Format

```
[Feature/Bugfix/Docs] Brief description

Example:
[Feature] Add Stripe payment integration
[Bugfix] Fix quota gate for midnight edge case
[Docs] Update API reference for new endpoints
```

### PR Description Template

```markdown
## Description
Brief explanation of changes

## Related Issue
Fixes #123

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How to test this change

## Screenshots
If UI changes, add screenshots

## Checklist
- [x] Tests pass
- [x] Code follows style guide
- [x] Self-reviewed code
- [x] Comments added
- [x] Documentation updated
- [x] No breaking changes
```

## Code Review Guidelines

When reviewing code, check for:

1. **Functionality**: Does it work as intended?
2. **Security**: Are there security issues?
   - RLS policies correct?
   - User validation present?
   - No SQL injection?
3. **Performance**: Are queries optimized?
   - Using indexes?
   - N+1 queries?
4. **Maintainability**: Is code clear?
   - Proper variable names?
   - Comments where needed?
   - Consistent with codebase?
5. **Testing**: Is it tested?
   - Edge cases covered?
   - Manual test results?

## Database Schema Changes

**Never** modify schema directly in production.

**Process**:
1. Create migration file: `migrations/001_add_feature.sql`
2. Test migration locally
3. Document breaking changes
4. Include rollback script
5. PR review required
6. Deploy and verify

Example migration:
```sql
-- migrations/001_add_paid_tier.sql
-- Up
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;

-- Down
ALTER TABLE profiles DROP COLUMN stripe_customer_id;
```

## Documentation Standards

All features must be documented:

1. **Code comments**: Complex logic explained
2. **JSDoc**: Function signatures documented
3. **README**: Feature added to main docs
4. **API_REFERENCE.md**: New APIs documented
5. **FEATURES.md**: Feature status updated

Example JSDoc:
```typescript
/**
 * Logs an outreach activity and updates daily quota
 * @param input - Activity details
 * @returns Success result with updated quota status
 */
export async function logOutreachActivity(input: LogOutreachInput) {
  // ...
}
```

## Security Considerations

**Before committing code:**

- [ ] No secrets in code (use env vars)
- [ ] User input validated
- [ ] SQL injection prevented (use RLS)
- [ ] CSRF tokens checked (built-in)
- [ ] Auth checks present
- [ ] Rate limiting considered
- [ ] Error messages safe (no leaks)

## Performance Guidelines

- Query under 100ms
- Render under 200ms
- Bundle size maintained
- No N+1 queries
- Indexes used for filters
- Pagination for large lists

## Areas for Contribution

### High Priority
- [ ] Stripe integration (Phase 1)
- [ ] Analytics dashboard (Phase 2)
- [ ] Email notifications (Phase 4)
- [ ] Test coverage (ongoing)

### Medium Priority
- [ ] Performance optimizations
- [ ] Documentation improvements
- [ ] UX enhancements
- [ ] Mobile responsiveness

### Low Priority (Fun)
- [ ] Themes/color schemes
- [ ] Animations
- [ ] Easter eggs
- [ ] Community features

## Reporting Issues

### Bug Report Template

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: macOS/Windows/Linux
- Browser: Chrome/Firefox/Safari
- Node version: 18+
- Supabase region: us-east-1

## Screenshots
If applicable

## Error Logs
```
Paste error messages here
```
```

### Feature Request Template

```markdown
## Description
Brief description of feature

## Problem Solved
What problem does this solve?

## Proposed Solution
How would you implement this?

## Alternative Solutions
Any alternatives considered?

## Additional Context
Links, resources, etc.
```

## Communication

- **Discussions**: GitHub Discussions for questions
- **Issues**: GitHub Issues for bugs/features
- **Discord**: Community chat (if available)
- **Email**: For security issues only

## Code of Conduct

- Be respectful
- No harassment
- Welcome all backgrounds
- Constructive feedback only
- Follow GitHub community guidelines

## License

By contributing, you agree your changes are licensed under the same license as the project (TBD).

## Questions?

- Check existing documentation
- Open a Discussion
- Ask in issues
- Email maintainers

---

Thank you for contributing to RevenueForge! 🚀
