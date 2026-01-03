# Schema Health & Drift Prevention

## Source of Truth Rules

1. **Declarative Schema Files** (`supabase/schemas/*.sql`) define the FINAL desired state of each table
2. **Migration Files** (`supabase/migrations/`) are artifacts generated via `supabase db diff` - do not edit by hand
3. **Live Database** is the actual running state - must match declarative schemas

### Hierarchy of Truth
```
supabase/schemas/*.sql (intent)
        ↓ generates
supabase/migrations/*.sql (artifacts)
        ↓ applies to
Live Database (reality)
```

## How to Prevent Drift

### Before Making Changes
1. Check if the column/constraint already exists in the declarative schema
2. Verify the schema file matches current DB state: `supabase db diff`
3. If drift exists, update schema files FIRST before adding new changes

### When Adding a Column
1. Add the column definition to the appropriate `supabase/schemas/XXX_*.sql` file
2. Add any constraints, indexes, or comments
3. Run `supabase db diff` to generate a migration
4. Review the migration, then apply

### When Modifying a Column
1. Update the column definition in the schema file
2. If there's existing data, consider data migration needs
3. Generate and apply migration

### When Removing a Column
1. Remove from schema file
2. Check for any code dependencies
3. Generate migration (will include DROP)

## Schema Drift Checklist

Run this checklist weekly or before any major release:

- [ ] Run `supabase db diff` - should return empty if no drift
- [ ] Check `credit_cards` table matches `003_credit_cards.sql`
- [ ] Check `analytics_events` table matches schema definition
- [ ] Verify all URL columns have `is_valid_http_url` CHECK constraints
- [ ] Confirm RLS is enabled on all user-data tables
- [ ] Verify all foreign keys are properly defined

## Common Drift Causes

1. **Direct DB edits** - Always use migrations, never edit production DB directly
2. **Migration without schema update** - If you write a manual migration, update the schema file too
3. **Rollbacks** - After rolling back, ensure schema files reflect the rolled-back state
4. **Multiple environments** - Keep all environments in sync

## Recovery from Drift

If drift is detected:

1. **Document the current DB state** - Query `information_schema.columns`
2. **Update schema files** to match reality
3. **Commit schema file updates** with clear message about sync
4. **From now on**, all changes go through schema files first

## Key Tables to Monitor

| Table | Schema File | Critical Fields |
|-------|-------------|-----------------|
| `credit_cards` | `003_credit_cards.sql` | annual_fee_cents, source_url, verification_status |
| `card_reward_rules` | `004_card_reward_rules.sql` | multiplier, category_id, card_id |
| `analytics_events` | (see audit schema) | event_name, user_id, context |
| `merchants` | `006_merchants.sql` | domain, category_id, verification_status |

## Automated Checks (Future)

Consider adding:
- CI/CD step that runs `supabase db diff` and fails if not empty
- Weekly cron job that emails drift report
- Pre-commit hook that validates schema files
