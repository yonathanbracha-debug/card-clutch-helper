# CardClutch Security Decisions

**Document Version:** 1.0  
**Last Updated:** 2026-01-03

## Overview

This document summarizes security architecture decisions and their rationale.

---

## 1. Role-Based Access Control (RBAC)

### Decision: Separate `user_roles` Table

**Choice:** Store roles in a separate `user_roles` table instead of on `profiles`.

**Rationale:**
- Prevents privilege escalation if profile update is compromised
- Enables multiple roles per user (future-proofing)
- Clear separation of identity (profiles) vs authorization (roles)
- Industry best practice for secure RBAC

**Implementation:**
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
```

---

## 2. SECURITY DEFINER Functions

### Decision: Minimal SECURITY DEFINER Usage

**Functions using SECURITY DEFINER:**
1. `has_role(uuid, app_role)` - Checks if user has a specific role
2. `handle_new_user_role()` - Trigger to assign default role on signup
3. `handle_new_user()` - Trigger to create profile on signup

**Safeguards Applied:**
- `SET search_path = public` on all DEFINER functions
- Functions return minimal data (boolean for has_role)
- No user input passed to dynamic SQL
- Functions only read, never modify sensitive data

**Why SECURITY DEFINER is Required:**
- `has_role()` must bypass RLS on `user_roles` to prevent infinite recursion in RLS policies
- Triggers must insert into protected tables during signup flow

---

## 3. URL Validation

### Decision: Multi-Layer URL Validation

**Implementation:** `src/lib/urlSafety.ts`

**Validation Rules:**
1. Must start with `http://` or `https://`
2. Reject dangerous schemes: `javascript:`, `data:`, `file:`, `vbscript:`, `about:`, `chrome:`
3. Validate hostname structure
4. Normalize domains (lowercase, handle punycode)
5. Strip tracking parameters for storage

**Database Enforcement:**
```sql
CREATE OR REPLACE FUNCTION public.is_valid_http_url(url text)
RETURNS boolean AS $$
BEGIN
  IF url IS NULL THEN RETURN true; END IF;
  IF NOT (url ~* '^https?://') THEN RETURN false; END IF;
  IF url ~* '(javascript:|data:|file:|vbscript:|about:)' THEN RETURN false; END IF;
  -- Additional validation...
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;
```

---

## 4. Row Level Security (RLS) Strategy

### Principles:

1. **RLS is the security boundary** - Client-side checks are convenience only
2. **Deny by default** - All tables have RLS enabled
3. **Least privilege** - Users can only access their own data
4. **Admin access via has_role()** - Centralized role checking

### Table Security Matrix:

| Data Type | Policy |
|-----------|--------|
| User personal data | Own row only |
| User activity logs | Own rows only |
| Catalog data (cards, merchants) | Public read |
| Admin operations | Admin role required |
| Audit logs | Insert own, read admin |

---

## 5. Client vs Server Security

### Decision: Server-Side as Primary Boundary

**Client-Side (Convenience):**
- `ProtectedRoute` component for UX
- `useIsAdmin()` hook for UI rendering
- These can be bypassed and are NOT security

**Server-Side (Security):**
- RLS policies on all tables
- `has_role()` function for authorization
- Database constraints for data integrity

**Example:**
```tsx
// Client - for UX only, not security
if (!isAdmin) return <NotAuthorized />;

// Server - actual security via RLS
// Policy: has_role(auth.uid(), 'admin')
```

---

## 6. Audit Logging

### Decision: Immutable Audit Trail

**Implementation:**
- `security_audit_log` table
- No UPDATE or DELETE policies (append-only)
- Tracks: actor, event type, payload, timestamp

**Logged Events:**
- Role changes
- Card catalog edits
- Merchant registry changes
- Admin actions

---

## 7. Authentication Flow

### Decision: Supabase Auth with Magic Links

**Features:**
- Email-based authentication
- No password storage in application
- Session managed by Supabase
- Auto-confirm enabled for development (disable in production)

**Security Considerations:**
- Redirect URL validation
- Session expiry handling
- Secure cookie settings (handled by Supabase)

---

## 8. Data Classification

| Classification | Examples | Protection |
|----------------|----------|------------|
| Public | Card catalog, merchant categories | Read-all policy |
| User Private | Wallet, recommendations, preferences | Owner-only RLS |
| Admin Only | Audit logs, waitlist, all user data | Admin role RLS |
| System | Auth tokens, sessions | Supabase managed |

---

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-03 | Initial security documentation | System |
