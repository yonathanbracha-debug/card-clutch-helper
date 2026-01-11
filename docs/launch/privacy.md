# Privacy & Data Storage Documentation

Last updated: 2026-01-11

## Overview

This document describes what data CardClutch stores, why it's stored, and the privacy protections in place.

---

## Data Stored

### User Questions (rag_queries)

| Column | Purpose | Retention | Access |
|--------|---------|-----------|--------|
| question | User's credit question text | Indefinite | Owner only |
| answer | AI-generated response | Indefinite | Owner only |
| user_id | Links query to user account | Indefinite | Owner only |
| ip_hash | Rate limiting, abuse prevention | 30 days | Service role only |
| confidence | Answer quality metric | Indefinite | Owner only |
| latency_ms | Performance monitoring | Indefinite | Admins only |
| model | AI model used | Indefinite | Admins only |

### Rate Limits (rate_limits)

| Column | Purpose | Retention | Access |
|--------|---------|-----------|--------|
| scope_type | Identifies limit type (ip/user) | 30 days | Service role only |
| scope_key | Hashed identifier | 30 days | Service role only |
| count | Request count | 30 days | Service role only |

---

## Privacy Protections

### IP Address Handling

**We NEVER store raw IP addresses.**

- Client IP is immediately hashed using SHA-256 + server-side salt
- Salt is stored in environment variable `RATE_LIMIT_SALT`
- Hash cannot be reversed to reveal original IP
- Used only for rate limiting, never for tracking

### ip_hash Exposure Prevention

- `ip_hash` column exists only in `rag_queries` base table
- `rag_queries_public` view excludes `ip_hash`
- Frontend must NEVER use `SELECT *` on `rag_queries`
- RLS prevents anon access to base table
- Edge functions never return `ip_hash` to clients

### User Data Isolation

- All user data tables have Row Level Security (RLS)
- Users can only access their own data
- `auth.uid() = user_id` check enforced at database level
- No cross-user data leakage possible

---

## Data Access Levels

| Role | profiles | rag_queries | user_preferences | rate_limits |
|------|----------|-------------|------------------|-------------|
| anon | ❌ | ❌ | ❌ | ❌ |
| authenticated (own) | ✅ | ✅ | ✅ | ❌ |
| authenticated (others) | ❌ | ❌ | ❌ | ❌ |
| admin | ✅ (own) | ✅ (all, via view) | ✅ (own) | ❌ |
| service_role | ✅ | ✅ | ✅ | ✅ |

---

## Question Text Storage

### Why we store questions

1. **User history**: Users can review their past questions
2. **Answer improvement**: Patterns help improve deterministic rules
3. **Debugging**: Helps diagnose answer quality issues

### What we DON'T do

- ❌ Sell or share question data
- ❌ Use questions for advertising
- ❌ Expose questions to other users
- ❌ Store unencrypted personal identifiers

---

## Data Cleanup

### Automatic Cleanup

Rate limit records older than 30 days are eligible for cleanup:

```sql
DELETE FROM rate_limits 
WHERE updated_at < NOW() - INTERVAL '30 days';
```

This should be run via scheduled cron or manual maintenance.

### User Data Deletion

Users can request deletion of:
- Their profile
- Their query history
- Their preferences

This triggers cascading deletes via foreign key relationships.

---

## Compliance Notes

### GDPR Considerations

- Users can access their data (via app)
- Users can request deletion
- Data is isolated per user
- No unnecessary data collection

### Security Measures

- All data encrypted at rest (Supabase default)
- TLS encryption in transit
- Row Level Security enforced
- Service role access logged
- Admin actions auditable via security_audit_log

---

## Contact

For privacy concerns or data requests, contact the project maintainers.
