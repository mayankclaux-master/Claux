# RANKING PIPELINE REPORT

**Phase:** Phase 1B - Real Tenant Execution & Operational Hardening  
**Component:** Ranking Pipeline  
**Date:** 2026-05-10  
**Status:** IMPLEMENTED

---

## EXECUTIVE SUMMARY

The ranking pipeline has been implemented to track keyword positions, calculate movements, and measure volatility over time. This provides the foundation for the Rankings UI with real data.

---

## IMPLEMENTATION DETAILS

### Ranking Seeds
- **Table:** `ranking_seeds`
- **Purpose:** Store initial keyword seeds for tracking
- **Fields:**
  - keyword (TEXT)
  - seed_type (manual, discovered, competitor)
  - opportunity_score (DECIMAL)
  - status (active, inactive)
- **Function:** `createRankingSeeds()`

### Ranking History
- **Table:** `ranking_history`
- **Purpose:** Track keyword position over time
- **Fields:**
  - keyword (TEXT)
  - position (INTEGER)
  - search_volume (INTEGER)
  - difficulty (INTEGER)
  - recorded_at (TIMESTAMPTZ)
- **Function:** `recordRankingSnapshot()`

### Ranking Movements
- **Table:** `ranking_movements`
- **Purpose:** Track position changes between snapshots
- **Fields:**
  - keyword (TEXT)
  - previous_position (INTEGER)
  - current_position (INTEGER)
  - movement (INTEGER)
  - movement_type (gain, loss, stable)
  - recorded_at (TIMESTAMPTZ)
- **Function:** `calculateRankingMovements()`

### Ranking Volatility
- **Table:** `ranking_volatility`
- **Purpose:** Measure position volatility over time periods
- **Fields:**
  - keyword (TEXT)
  - volatility_score (DECIMAL)
  - volatility_level (low, medium, high)
  - period_days (INTEGER)
  - calculated_at (TIMESTAMPTZ)
- **Function:** `calculateRankingVolatility()`

---

## DATA FLOW

1. **Seed Creation:** ARIA discovers keywords → creates ranking seeds
2. **Snapshot Recording:** Periodic ranking checks → record snapshots
3. **Movement Calculation:** Compare snapshots → calculate movements
4. **Volatility Analysis:** Analyze history → calculate volatility

---

## API FUNCTIONS

### createRankingSeeds()
```typescript
createRankingSeeds(tenantId, workspaceId, seeds: RankingSeed[])
```
Creates initial ranking seeds from discovered keywords.

### recordRankingSnapshot()
```typescript
recordRankingSnapshot(tenantId, snapshots: RankingSnapshot[])
```
Records current ranking positions and automatically calculates movements.

### calculateRankingVolatility()
```typescript
calculateRankingVolatility(tenantId, keyword, periodDays?)
```
Calculates volatility score for a keyword over a time period.

### getRankingHistory()
```typescript
getRankingHistory(tenantId, keyword, limit?)
```
Retrieves historical ranking data for a keyword.

### getRankingMovements()
```typescript
getRankingMovements(tenantId, limit?)
```
Retrieves ranking movements for a tenant.

---

## TENANT ISOLATION

- All tables include `tenant_id`
- RLS policies ensure tenant isolation
- Indexes for tenant-scoped queries

---

## INTEGRATION POINTS

- **ARIA:** Creates ranking seeds from discovered keywords
- **DataForSEO:** Provides ranking data for snapshots
- **Rankings UI:** Displays ranking history, movements, volatility

---

## STATUS

✅ Ranking seeds implemented  
✅ Ranking history implemented  
✅ Ranking movements implemented  
✅ Ranking volatility implemented  
✅ API functions implemented  
✅ Tenant isolation verified  

---

## NEXT STEPS

- Integrate with DataForSEO for real ranking data
- Connect Rankings UI to real data
- Implement ranking alert notifications
- Add ranking trend analysis
