# CardClutch — Data Governance Policy

## Version 1.0 | Operational Data Management

---

## 1. Purpose

This document defines the operational policies for managing CardClutch's financial data. It complements the Global Backend Specification with day-to-day procedures.

---

## 2. Data Classification

### 2.1 Sensitivity Levels

| Level | Data Type | Handling |
|-------|-----------|----------|
| **PUBLIC** | Card names, general reward categories | Freely displayed |
| **INTERNAL** | Verification notes, source URLs | Authenticated users only |
| **RESTRICTED** | User wallets, search history | User-only access |
| **AUDIT** | Change logs, verification events | Admin/service role only |

### 2.2 PII Handling

- User email stored only in `profiles`
- Search history anonymizable (user_id nullable)
- No credit card numbers ever stored
- No SSN, account numbers, or financial identifiers

---

## 3. Verification Workflow

### 3.1 Status Lifecycle

```
needs_review → verified ← stale
     ↓            ↓         ↑
  rejected    deprecated    │
                            │
              (180 days)────┘
```

### 3.2 Verification Requirements

| Status Transition | Requirements |
|-------------------|--------------|
| → verified | At least 1 source linked |
| → stale | Automatic after 180 days |
| → deprecated | Manual with reason |
| → disputed | User correction request |

### 3.3 Verification Checklist

Before marking any entity as `verified`:

- [ ] Source URL accessible and current
- [ ] Data matches source exactly
- [ ] Effective dates set correctly
- [ ] No conflicting active records
- [ ] Source linked via `entity_sources`

---

## 4. Update Procedures

### 4.1 Issuer Term Changes

When an issuer updates terms:

1. **Identify affected entities**
   ```sql
   SELECT c.id, c.official_product_name, r.id as rule_id
   FROM credit_cards c
   JOIN card_reward_rules r ON r.card_id = c.id
   WHERE c.issuer_id = '[issuer-id]'
     AND c.verification_status = 'verified';
   ```

2. **Create new source record**
   ```sql
   INSERT INTO sources (source_type, url, issuer_id, is_authoritative)
   VALUES ('issuer_terms', 'https://...', '[issuer-id]', true);
   ```

3. **Expire old records, insert new** (see main spec)

4. **Verify new records**

5. **Log in change log** (automatic via trigger)

### 4.2 Merchant Reclassification

When a merchant's category changes:

1. **Document the change source**
2. **Update merchant category**
   ```sql
   UPDATE merchants
   SET default_category_id = '[new-category-id]',
       verification_status = 'needs_review',
       last_verified_at = NULL
   WHERE id = '[merchant-id]';
   ```
3. **Add source and verify**
4. **Review affected exclusions**

### 4.3 Emergency Corrections

For urgent data fixes (user-reported errors):

1. **Create correction request** (logged)
2. **Admin review within 24 hours**
3. **If approved:**
   - Mark current as deprecated
   - Insert corrected version
   - Document in change log
4. **If rejected:**
   - Document reason
   - Notify requester

---

## 5. Staleness Management

### 5.1 Daily Operations

```sql
-- Check stale count
SELECT COUNT(*) FROM v_stale_entities;

-- Get priority queue
SELECT * FROM v_top_priority_review_queue LIMIT 20;

-- Schedule verifications
SELECT schedule_stale_verifications(CURRENT_DATE + 7);
```

### 5.2 Weekly Review

- Review top 50 stale entities
- Clear pending verification schedules
- Check data quality metrics

### 5.3 Monthly Audit

- Full staleness report
- Source freshness check
- User correction request review
- System health metrics export

---

## 6. AI Inference Governance

### 6.1 Inference Approval Process

1. AI creates suggestion in `merchant_category_inference`
2. Suggestion remains `accepted = false`
3. Human reviews:
   - Check confidence score
   - Verify against available sources
   - Consider user feedback
4. If approved:
   - Set `accepted = true`, `reviewed_by_human = true`
   - Trigger copies to canonical tables
5. If rejected:
   - Set `accepted = false` permanently
   - Document rejection reason

### 6.2 AI Limitations

AI may **NEVER**:
- Set or modify `annual_fee_cents`
- Create reward rules directly
- Override human verifications
- Access user personal data
- Make recommendations without audit log

---

## 7. Access Control Matrix

| Role | Cards Read | Rules Read | Write Canonical | View Audit | Manage Users |
|------|------------|------------|-----------------|------------|--------------|
| Anonymous | ✓ | ✓ | ✗ | ✗ | ✗ |
| Authenticated | ✓ | ✓ | ✗ | ✗ | Own only |
| Data Operator | ✓ | ✓ | ✓ | ✓ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 8. Incident Response

### 8.1 Data Accuracy Incident

**Definition:** User reports incorrect recommendation that caused financial loss.

**Response:**
1. Immediately flag entity as `disputed`
2. Pull audit log for recommendation
3. Trace to source data
4. Determine root cause
5. Apply correction if needed
6. Document incident
7. Review for systemic issues

### 8.2 Source Unavailability

**Definition:** Primary source URL returns 404 or changes structure.

**Response:**
1. Mark source as potentially stale
2. Search for alternate official source
3. If found: update source URL
4. If not found: mark entities as `stale`
5. Escalate if critical (high-usage cards)

---

## 9. Retention Policy

| Data Type | Retention | Reason |
|-----------|-----------|--------|
| Canonical data (current) | Indefinite | Core product |
| Canonical data (expired) | 7 years | Audit trail |
| User search history | 90 days | Analytics |
| Recommendation audit | 2 years | Compliance |
| Change logs | 7 years | Legal |
| AI inferences | 1 year | Review backlog |

---

## 10. Compliance Considerations

### 10.1 User Data Rights

- Right to access: User can view all their data
- Right to delete: User cards, preferences, history deletable
- Right to correct: Via data correction requests
- Right to export: API endpoint for data export

### 10.2 Financial Data Accuracy

- All displayed values sourced and dated
- Uncertainty explicitly communicated
- No guarantee of reward receipt
- Terms & conditions always linked

---

## Appendix: Quick Reference Commands

### Check System Health
```sql
SELECT * FROM v_data_quality_metrics;
```

### View Recent Changes
```sql
SELECT * FROM canonical_change_log
ORDER BY created_at DESC LIMIT 20;
```

### Find Unverified High-Priority Items
```sql
SELECT * FROM v_top_priority_review_queue
WHERE stale_reason = 'never_verified'
LIMIT 10;
```

### Verify an Entity
```sql
-- 1. Add source
INSERT INTO entity_sources (entity_type, entity_id, source_id)
VALUES ('card', '[card-id]', '[source-id]');

-- 2. Update status
UPDATE credit_cards
SET verification_status = 'verified'
WHERE id = '[card-id]';
```

---

*Last Updated: 2024-01-15*
*Review Cycle: Quarterly*
