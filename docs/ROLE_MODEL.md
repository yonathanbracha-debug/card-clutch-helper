# CardClutch Role Model

**Document Version:** 1.0  
**Last Updated:** 2026-01-03

## Overview

CardClutch uses a simple, secure role-based access control (RBAC) system with two roles:
- **user** - Default role for all registered users
- **admin** - Elevated role for managing catalog data and viewing analytics

## Data Model

### Choice: Separate `user_roles` Table

We chose a separate roles table over storing role on the `profiles` table.

**Reasons:**
1. **Security** - Prevents privilege escalation via profile UPDATE
2. **Flexibility** - Supports multiple roles per user in future
3. **Audit Trail** - Easier to track role changes
4. **Separation of Concerns** - Identity vs Authorization

### Schema

```sql
-- Enum for type safety
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

-- RLS enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own roles" 
  ON public.user_roles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
  ON public.user_roles FOR SELECT 
  USING (has_role(auth.uid(), 'admin'));
```

### Auto-Assignment Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
```

## Role Hierarchy

```
admin
  └── user (inherits all user permissions)
      └── anonymous (no permissions)
```

## Permission Matrix

| Action | Anonymous | User | Admin |
|--------|-----------|------|-------|
| View card catalog | ✅ | ✅ | ✅ |
| View merchant registry | ✅ | ✅ | ✅ |
| Run recommendations | ✅ (demo) | ✅ | ✅ |
| Save wallet | ❌ | ✅ | ✅ |
| View own history | ❌ | ✅ | ✅ |
| Edit card catalog | ❌ | ❌ | ✅ |
| Edit merchant registry | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ✅ |
| View analytics | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |

## Role Checking

### Database Level (Security Boundary)

```sql
-- SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Used in RLS policies
CREATE POLICY "Admins can edit cards"
  ON public.credit_cards
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));
```

### Application Level (UI Convenience)

```typescript
// src/hooks/useIsAdmin.ts
export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return setIsAdmin(false);
    
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  return { isAdmin };
}
```

## Bootstrap Process

### First Admin (Owner Bootstrap)

Since there's no admin initially, the first admin must be created via direct database access:

```sql
-- Run once via Supabase SQL editor or migration
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'admin');
```

### Subsequent Admins

Existing admins can promote users via the Admin UI:

1. Navigate to `/admin/users`
2. Find user by email
3. Click "Make Admin"
4. Changes are logged in `security_audit_log`

## Security Considerations

1. **No Self-Promotion** - Users cannot assign themselves admin role
2. **RLS Enforcement** - Role changes require existing admin
3. **Audit Trail** - All role changes logged
4. **Client Checks are UI Only** - Server RLS is the security boundary
5. **SECURITY DEFINER Minimal** - Only `has_role()` uses DEFINER

## Future Considerations

The current model supports extension:

- **Owner Role** - Super-admin who can manage admins
- **Moderator Role** - Can review AI suggestions but not edit catalog
- **API Key Role** - For programmatic access
- **Granular Permissions** - Per-table or per-action permissions
