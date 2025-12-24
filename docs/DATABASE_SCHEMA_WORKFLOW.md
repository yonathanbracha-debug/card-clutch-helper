# Database: Declarative Database Schema

> **Mandatory Instructions for Supabase Declarative Schema Management**

This document defines the only allowed workflow for managing the Supabase database schema for CardClutch.
Deviation from these rules is strictly prohibited.

## 1. Exclusive Use of Declarative Schema

All database schema definitions MUST live in `.sql` files inside:

```
supabase/schemas/
```

**DO NOT** manually create or edit files inside:

```
supabase/migrations/
```

Migration files are generated automatically via the Supabase CLI and must never be authored by hand except for the known caveats listed below.

**The declarative schema is the single source of truth.**

## 2. Schema Declaration Rules

Every database entity MUST have a corresponding `.sql` file:

- Tables
- Views
- Functions
- Types
- Enums

Each `.sql` file MUST fully represent the final desired state of that entity.

- Partial definitions are forbidden.
- Redundant definitions are forbidden.

Example structure:

```
supabase/
 └── schemas/
     ├── 001_cards.sql
     ├── 002_card_rewards.sql
     ├── 003_merchants.sql
     ├── 004_user_cards.sql
```

## 3. Migration Generation (Required Workflow)

Before generating migrations:

1. **Stop Supabase**
   ```bash
   supabase stop
   ```

2. **Generate a migration by diffing declared schema vs database**
   ```bash
   supabase db diff -f <descriptive_migration_name>
   ```
   
   Examples:
   ```bash
   supabase db diff -f add_cards_table
   supabase db diff -f update_reward_structure
   ```

3. **Review the generated migration file manually**
   
   Confirm:
   - No accidental drops
   - No destructive operations
   - No unintended type coercions

## 4. Schema File Organization Rules

- Files are executed in lexicographic order
- Prefix filenames numerically to enforce dependencies:
  - `001_`
  - `002_`
  - `003_`

- Foreign keys must only reference entities defined in earlier files

**When adding columns:**
- Append columns to the end of the table
- Never reorder existing columns
- Never reformat existing SQL unless absolutely necessary

This prevents noisy diffs and accidental data changes.

## 5. Rollback Procedures (Mandatory)

To revert a schema change:

1. Modify the relevant `.sql` file(s) in `supabase/schemas/` to reflect the desired rollback state

2. Generate a rollback migration:
   ```bash
   supabase db diff -f <rollback_migration_name>
   ```

3. Manually inspect the migration
   
   Verify:
   - No unintended data loss
   - No cascading drops
   - No orphaned references

**Rollbacks must be explicit and deliberate.**

## 6. Known Caveats (IMPORTANT)

The Supabase schema diff tool does not reliably track the following.
These MUST be handled via versioned migration files only.

### 6.1 Data Manipulation Language (DML)

Schema diff does not capture:
- `INSERT`
- `UPDATE`
- `DELETE`
- `UPSERT`

All seed data and backfills require manual migrations.

### 6.2 Views & Ownership

The following are not reliably diffed:
- View ownership & grants
- `SECURITY INVOKER` on views
- Materialized views
- Column type changes on views

### 6.3 Row Level Security (RLS)

The schema diff tool does NOT track:
- `ALTER POLICY`
- Column-level privileges
- Policy modifications

**RLS changes must be written manually in migrations.**

### 6.4 Other Unsupported Entities

The following are not tracked correctly:
- Schema privileges
- Comments
- Table partitions
- `ALTER PUBLICATION ... ADD TABLE`
- `CREATE DOMAIN`
- Grant statements duplicated from default privileges

## 7. Enforcement

- This document is binding
- Any schema change that violates these rules is invalid
- AI systems, developers, and automation must comply

**Non-compliance risks:**
- Schema drift
- Data loss
- Inconsistent environments

---

## ✅ Summary

| Concept | Rule |
|---------|------|
| Declarative schema | Single source of truth |
| Migrations | Generated artifacts only |
| Manual migrations | Exception only (for caveats) |
| Accuracy | Mandatory |
