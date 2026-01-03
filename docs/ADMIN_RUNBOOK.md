# CardClutch Admin Runbook

**Document Version:** 1.0  
**Last Updated:** 2026-01-03

## Overview

This runbook provides step-by-step instructions for common administrative tasks.

---

## 1. Making the First Admin (Owner Bootstrap)

**When:** First time setup, no admins exist yet.

**Prerequisites:**
- Access to Supabase Dashboard or SQL editor
- A registered user account in CardClutch

### Steps:

1. **Get your user ID:**
   - Sign up/sign in to CardClutch
   - Open browser DevTools → Console
   - Run: `JSON.parse(localStorage.getItem('sb-vtpujsezuxqbqfyjrbdc-auth-token'))?.user?.id`
   - Copy the UUID

2. **Via Supabase SQL Editor:**
   ```sql
   -- Replace with your actual user ID
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your-user-uuid-here', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. **Verify:**
   - Refresh CardClutch
   - Navigate to `/admin`
   - You should see the admin dashboard

### Alternative: Via Supabase Table Editor

1. Go to Supabase Dashboard → Table Editor
2. Select `user_roles` table
3. Click "Insert row"
4. Enter your `user_id` and set `role` to `admin`
5. Click "Save"

---

## 2. Adding an Admin

**When:** Promoting an existing user to admin.

**Who can do this:** Existing admins only.

### Via Admin UI:

1. Navigate to `/admin`
2. Click "Users" tab
3. Find the user by email
4. Click the role dropdown
5. Select "admin"
6. Confirm the change

### Via SQL (Emergency):

```sql
-- Get user ID first
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Promote to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-from-above', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 3. Removing Admin Access

**When:** Demoting an admin back to regular user.

### Via Admin UI:

1. Navigate to `/admin`
2. Click "Users" tab
3. Find the admin user
4. Click the role dropdown
5. Select "user"
6. Confirm the change

### Via SQL:

```sql
-- Remove admin role (user role remains)
DELETE FROM public.user_roles 
WHERE user_id = 'user-uuid-here' 
  AND role = 'admin';
```

---

## 4. Viewing Audit Logs

**When:** Investigating changes, compliance, security review.

### Via Admin UI:

1. Navigate to `/admin`
2. Click "Audit Logs" tab
3. Use filters:
   - Event type dropdown
   - Date range picker
4. Click on a row to see full payload

### Via SQL:

```sql
-- Recent admin actions
SELECT 
  created_at,
  event_type,
  event_payload,
  actor_user_id
FROM security_audit_log
ORDER BY created_at DESC
LIMIT 100;

-- Specific event type
SELECT * FROM security_audit_log
WHERE event_type = 'ROLE_CHANGE'
ORDER BY created_at DESC;

-- By user
SELECT * FROM security_audit_log
WHERE actor_user_id = 'user-uuid'
ORDER BY created_at DESC;
```

---

## 5. Managing Card Catalog

### Adding a New Card:

1. Navigate to `/admin`
2. Click "Card Manager" tab
3. Click "Add Card"
4. Fill in required fields:
   - Name, Issuer, Network
   - Annual fee (in cents)
   - Source URL
5. Add reward rules
6. Click "Save"

### Editing a Card:

1. Navigate to `/admin` → "Card Manager"
2. Find the card
3. Click "Edit"
4. Make changes
5. Update `last_verified_at` if fee/rules changed
6. Click "Save"

### Marking Card Verified:

1. Navigate to `/admin` → "Card Manager"
2. Find the card
3. Click "Mark Verified"
4. This updates `last_verified_at` to now

---

## 6. Managing Merchant Registry

### Approving AI Suggestions:

1. Navigate to `/admin`
2. Click "AI Review" tab
3. Review pending suggestions
4. For each:
   - Check suggested category
   - Adjust if needed
   - Click "Approve" or "Reject"

### Adding Merchant Manually:

1. Navigate to `/admin` → "Merchants"
2. Click "Add Merchant"
3. Enter:
   - Domain (e.g., example.com)
   - Display name
   - Category
4. Click "Save"

---

## 7. Handling Data Issues

### Viewing Reports:

1. Navigate to `/admin`
2. Click "Reports" tab (if available)
3. Review open issues
4. Click on issue for details

### Resolving an Issue:

1. Find the issue
2. Add admin notes
3. Make necessary corrections
4. Mark as "Resolved"

---

## 8. Emergency Procedures

### Revoking All Admin Access:

```sql
-- Nuclear option: remove all admins
DELETE FROM public.user_roles WHERE role = 'admin';
```

**Warning:** You'll need direct DB access to restore an admin.

### Checking for Unauthorized Access:

```sql
-- Recent role changes
SELECT * FROM security_audit_log
WHERE event_type = 'ROLE_CHANGE'
ORDER BY created_at DESC
LIMIT 50;

-- Users with admin role
SELECT ur.*, au.email
FROM user_roles ur
JOIN auth.users au ON au.id = ur.user_id
WHERE ur.role = 'admin';
```

### Disabling a User:

Currently not implemented. Options:
1. Remove from user_roles
2. Delete from auth.users (via Supabase Dashboard)

---

## Common Issues

### "Not Authorized" on /admin

**Cause:** User doesn't have admin role.

**Fix:** 
1. Check user_roles table for the user
2. Add admin role if needed
3. User must sign out and sign in again

### Role Change Not Reflecting

**Cause:** Cached session data.

**Fix:**
1. Sign out completely
2. Clear localStorage
3. Sign in again

### Audit Log Not Showing

**Cause:** User doesn't have admin role.

**Fix:** Only admins can view audit logs due to RLS policy.

---

## Contact

For issues not covered here:
- Check `/docs` folder for detailed documentation
- Review security scan report
- Check Supabase logs for errors
