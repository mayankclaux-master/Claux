# FINAL SCHEMA CONVERGENCE PLAN

**Phase:** Phase 1B Database Convergence Audit  
**Date:** 2026-05-10  
**Status:** COMPLETED

---

## EXECUTIVE SUMMARY

After comprehensive audit of 45 database tables across 10 subsystems, **7 critical conflicts** were identified. The convergence action required is:

## **E) RUNTIME CODE REFACTOR NEEDED**

---

## DETERMINATION

### Why Runtime Code Refactor (Not Migration)

**Schema Reality:**
- Database schema likely exists (Supabase deployed)
- Tables referenced in code may exist with different names
- Cannot assume schema is missing or incorrect

**Code Reality:**
- Code references both `agent_*` and `runtime_*` table conventions
- Credential storage fragmented across 4 tables
- Agent state duplicated across 3 tables
- Repository pattern inconsistent across runtime layer
- No verification of which convention matches actual schema

**Risk Assessment:**
- Blind migration risks data loss if tables exist
- Blind rename risks runtime crashes if code assumptions wrong
- Cannot proceed without knowing actual schema state

**Conclusion:** Must refactor code to single convention before any schema changes.

---

## CONVERGENCE STRATEGY

### Phase 1: Schema Verification (Pre-Refactor)

**Objective:** Determine actual schema state before code changes

**Actions:**
1. Export actual Supabase schema
2. Compare with DATABASE_REFERENCE_MAP.md
3. Identify which tables exist
4. Identify naming convention in use
5. Identify which credential tables exist
6. Identify which agent state tables exist

**Success Criteria:**
- Complete inventory of actual tables
- Mapping of code references → actual table names
- Identification of missing tables
- Identification of orphaned code references

---

### Phase 2: Code Convergence (Primary Action)

**Objective:** Unify code to single table naming convention

**Strategy A: If `agent_*` tables exist (Likely)**
- Migrate all code from `runtime_*` to `agent_*`
- Remove `runtime_*` references from codebase
- Implement repository pattern for all runtime tables
- Update observability layer to use `agent_*` tables
- Deprecate `runtime_thinking_logs` or merge into `agent_logs`

**Strategy B: If `runtime_*` tables exist**
- Migrate all code from `agent_*` to `runtime_*`
- Update repository pattern for `runtime_*` tables
- Migrate `agent_states`/`agent_activities`/`agent_runs` to new convention
- Update all API routes and services

**Strategy C: If both exist**
- Choose canonical convention (recommend `runtime_*` for new system)
- Migrate data from legacy to canonical
- Update all code to canonical convention
- Drop legacy tables after migration

---

### Phase 3: Credential Unification

**Objective:** Consolidate credential storage

**Strategy:**
1. Audit which credential tables exist
2. If `integrations` exists: Use as canonical (most complete)
3. Migrate `gsc_credentials`, `cms_credentials`, `credentials` to `integrations`
4. Update all code to use `integrations` table
5. Drop legacy credential tables
6. Update encryption strategy if needed

---

### Phase 4: Agent State Consolidation

**Objective:** Single source of truth for agent state

**Strategy:**
1. Audit which agent state tables exist
2. If all 3 exist: Merge into single table with state history
3. Design unified schema: `agent_state_history` with current state derived
4. Migrate existing data
5. Update code to use unified table
6. Add transactional consistency
7. Drop legacy state tables

---

### Phase 5: Repository Pattern Implementation

**Objective:** Consistent data access layer

**Strategy:**
1. Implement repository pattern for chosen convention
2. Create base repository with common operations
3. Implement specific repositories for each table
4. Update all direct Supabase calls to use repositories
5. Add transaction support for multi-table operations
6. Add consistent error handling

---

## DETAILED REFACTOR PLAN

### Step 1: Schema Export (1 day)
- Export actual Supabase schema to SQL
- Document all tables, columns, indexes, FKs, RLS
- Compare with DATABASE_REFERENCE_MAP.md
- Generate schema delta report

### Step 2: Convention Decision (1 day)
- Based on schema audit, choose canonical naming
- Document decision rationale
- Create migration strategy document
- Get approval from stakeholders

### Step 3: Runtime Code Refactor (3-5 days)
- Update `lib/runtime/database.ts` to use canonical convention
- Update `lib/runtime/repositories/` for canonical tables
- Update `lib/observability/execution-metrics.ts`
- Update `lib/runtime/thinking/thinking-logs.ts`
- Update API routes: `app/api/tasks/*`
- Update type definitions

### Step 4: Credential Refactor (2-3 days)
- Consolidate credential storage to single table
- Update `lib/onboarding/credentials.ts`
- Update `lib/onboarding/ingestion.ts`
- Update `lib/integrations/utils.ts`
- Update `lib/integrations/token-refresh/job.ts`
- Update API routes: `app/api/integrations/*`

### Step 5: Agent State Refactor (2-3 days)
- Design unified agent state schema
- Update `lib/dashboard/index.ts`
- Update `app/api/v1/agent-update/route.ts`
- Update `app/api/v1/orchestrator/trigger-agent/route.ts`
- Update `app/api/dev/simulate-agent/route.ts`
- Add transactional consistency

### Step 6: Repository Pattern Completion (2-3 days)
- Implement missing repositories
- Update all direct Supabase calls
- Add transaction support
- Add consistent error handling
- Update metrics repository

### Step 7: Testing & Validation (2-3 days)
- Unit tests for refactored code
- Integration tests for data access
- Verify tenant isolation
- Verify RLS policies
- Verify FK constraints
- Performance testing

### Step 8: Rollout Plan (1-2 days)
- Staged rollout strategy
- Backward compatibility plan
- Rollback procedure
- Monitoring strategy
- Success criteria

---

## MIGRATION CONSIDERATIONS (POST-REFACTOR)

### Only After Code Refactor Complete:

**If schema changes needed:**
- Additive migrations only (CREATE TABLE, ADD COLUMN)
- No DROP TABLE until data migrated
- No RENAME TABLE until code updated
- Verify all FK constraints exist
- Verify all indexes exist
- Verify RLS policies match code assumptions

**Data Migration Strategy:**
- Create new tables with canonical names
- Migrate data from legacy tables
- Validate data integrity
- Update code to use new tables
- Drop legacy tables after validation

---

## RISK MITIGATION

### High-Risk Areas:
1. **Runtime table duality** - Mitigation: Schema audit first, staged migration
2. **Credential fragmentation** - Mitigation: Test encryption strategy, backup data
3. **Agent state duplication** - Mitigation: Transactional consistency, rollback plan

### Rollback Strategy:
- Feature flags for new code paths
- Dual-write during migration
- Validation before dropping legacy tables
- Automated rollback procedures

---

## SUCCESS CRITERIA

### Code Convergence:
- ✅ Single table naming convention throughout codebase
- ✅ Consistent repository pattern for all tables
- ✅ Unified credential storage
- ✅ Single source of truth for agent state
- ✅ All direct Supabase calls replaced with repositories

### Schema Alignment:
- ✅ Code references match actual schema
- ✅ All FK constraints exist and enforced
- ✅ All indexes exist for performance
- ✅ RLS policies match code assumptions
- ✅ No orphaned code references

### Runtime Safety:
- ✅ Transactional consistency for multi-table operations
- ✅ Error handling consistent across data layer
- ✅ Tenant isolation verified
- ✅ No silent data integrity violations

---

## TIMELINE ESTIMATE

- **Phase 1 (Schema Verification):** 1-2 days
- **Phase 2 (Code Convergence):** 7-12 days
- **Phase 3 (Schema Migration - if needed):** 3-5 days
- **Phase 4 (Testing & Validation):** 2-3 days
- **Phase 5 (Rollout):** 1-2 days

**Total:** 14-24 days

---

## CONCLUSION

**Required Action:** E) RUNTIME CODE REFACTOR NEEDED

**Rationale:** Cannot safely execute schema migrations without knowing actual schema state and converging code to single convention. Code references are inconsistent and must be unified before any database changes.

**Next Steps:**
1. Export actual Supabase schema
2. Compare with codebase references
3. Choose canonical naming convention
4. Execute code refactor
5. Only then consider schema migrations

**Do NOT execute migrations until code refactor complete.**
