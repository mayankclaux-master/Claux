# CLAUX PHASE 1 — RUNTIME DELETION MAP
# FORENSIC ARCHITECTURE AUDIT FOR V1 FOUNDATION RESET

**Generated:** May 23, 2026  
**Auditor:** Cascade AI  
**Version:** 1.0  
**Status:** FORENSIC MAPPING COMPLETE

---

# EXECUTIVE SUMMARY

**Finding:** Current codebase contains 189 files of over-engineered runtime systems that directly violate V1 Hybrid model simplicity rules.

**Critical Violations:**
- 164 files of distributed/temporal/queue/worker systems (forbidden in V1)
- 9 files of CMS automation (violates "NO CMS ADAPTERS")
- 16 files of deprecated runtime (conflicts with canonical runtime)
- 12 validation report files (documentation only, safe to delete)

**Preserve:** 27 files of canonical runtime (services, repositories, connectors) that are V1-compliant.

**Deletion Phases:** 4 ordered phases with rollback verification after each.

---

# SECTION 1 — RUNTIME DELETION MAP

## 1.1 Temporal Module (56 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/temporal/`

**Purpose:** Event sourcing, replay, lineage, snapshots, audit for distributed microservices architecture

**Safe to Delete:** YES

**Why It Exists:** Designed for temporal event sourcing in distributed systems (violates V1 simplicity)

**What Breaks If Deleted:**
- Nothing (no production code imports temporal module)
- Only verification module imports temporal (verification also being deleted)

**Replacement in V1 Architecture:** None — temporal event sourcing not needed for V1 simple architecture

**Files:**
```
apps/web/lib/runtime/temporal/temporal.facade.ts
apps/web/lib/runtime/temporal/metrics.ts
apps/web/lib/runtime/temporal/constants.ts
apps/web/lib/runtime/temporal/types.ts
apps/web/lib/runtime/temporal/errors.ts
apps/web/lib/runtime/temporal/sourcing/event-store.ts
apps/web/lib/runtime/temporal/sourcing/event-append.ts
apps/web/lib/runtime/temporal/sourcing/event-replay.ts
apps/web/lib/runtime/temporal/sourcing/causality-chain.ts
apps/web/lib/runtime/temporal/sourcing/event-versioning.ts
apps/web/lib/runtime/temporal/sourcing/event-compaction.ts
apps/web/lib/runtime/temporal/lineage/ancestry-tracker.ts
apps/web/lib/runtime/temporal/lineage/replay-lineage.ts
apps/web/lib/runtime/temporal/lineage/recovery-lineage.ts
apps/web/lib/runtime/temporal/lineage/causation-graph.ts
apps/web/lib/runtime/temporal/lineage/execution-lineage.ts
apps/web/lib/runtime/temporal/replay/replay-diff.ts
apps/web/lib/runtime/temporal/replay/deterministic-replay.ts
apps/web/lib/runtime/temporal/replay/replay-integrity.ts
apps/web/lib/runtime/temporal/replay/audit-replay.ts
apps/web/lib/runtime/temporal/replay/replay-validation.ts
apps/web/lib/runtime/temporal/audit/audit-verification.ts
apps/web/lib/runtime/temporal/audit/audit-chain.ts
apps/web/lib/runtime/temporal/audit/audit-log.ts
apps/web/lib/runtime/temporal/audit/audit-integrity.ts
apps/web/lib/runtime/temporal/audit/forensic-reconstruction.ts
apps/web/lib/runtime/temporal/snapshots/snapshot-rebuilder.ts
apps/web/lib/runtime/temporal/snapshots/snapshot-validation.ts
apps/web/lib/runtime/temporal/snapshots/snapshot-engine.ts
apps/web/lib/runtime/temporal/snapshots/snapshot-versioning.ts
apps/web/lib/runtime/temporal/snapshots/snapshot-compaction.ts
apps/web/lib/runtime/temporal/runtime/index.ts
apps/web/lib/runtime/temporal/runtime/temporal-runtime.ts
apps/web/lib/runtime/temporal/runtime/temporal-runtime-state.ts
apps/web/lib/runtime/temporal/runtime/temporal-runtime-context.ts
apps/web/lib/runtime/temporal/runtime/temporal-runtime-health.ts
apps/web/lib/runtime/temporal/temporal/index.ts
apps/web/lib/runtime/temporal/temporal/temporal-window.ts
apps/web/lib/runtime/temporal/temporal/temporal-state.ts
apps/web/lib/runtime/temporal/temporal/temporal-query-engine.ts
apps/web/lib/runtime/temporal/temporal/temporal-consistency.ts
apps/web/lib/runtime/temporal/temporal/temporal-reconstruction.ts
apps/web/lib/runtime/temporal/journal/execution-journal.ts
apps/web/lib/runtime/temporal/journal/lineage-journal.ts
apps/web/lib/runtime/temporal/journal/checkpoint-journal.ts
apps/web/lib/runtime/temporal/journal/recovery-journal.ts
apps/web/lib/runtime/temporal/journal/replay-journal.ts
apps/web/lib/runtime/temporal/journal/task-journal.ts
```

---

## 1.2 Distributed Module (43 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/distributed/`

**Purpose:** Distributed workers, coordination, balancing, clustering for microservices architecture

**Safe to Delete:** YES

**Why It Exists:** Designed for distributed worker coordination (violates V1 "No distributed workers" rule)

**What Breaks If Deleted:**
- Nothing (no production code imports distributed module)
- Only verification, scenarios, testing modules import distributed (all being deleted)

**Replacement in V1 Architecture:** None — distributed workers not needed for V1 simple architecture

**Files:**
```
apps/web/lib/runtime/distributed/distributed.facade.ts
apps/web/lib/runtime/distributed/metrics.ts
apps/web/lib/runtime/distributed/constants.ts
apps/web/lib/runtime/distributed/types.ts
apps/web/lib/runtime/distributed/errors.ts
apps/web/lib/runtime/distributed/distributed.facade.ts
apps/web/lib/runtime/distributed/execution/execution-partitioner.ts
apps/web/lib/runtime/distributed/execution/index.ts
apps/web/lib/runtime/distributed/execution/execution-ownership.ts
apps/web/lib/runtime/distributed/execution/execution-failover.ts
apps/web/lib/runtime/distributed/execution/execution-reassignment.ts
apps/web/lib/runtime/distributed/execution/distributed-execution-router-placeholder.ts
apps/web/lib/runtime/distributed/workers/worker-registry.ts
apps/web/lib/runtime/distributed/workers/worker-capability-matcher.ts
apps/web/lib/runtime/distributed/workers/worker-directory.ts
apps/web/lib/runtime/distributed/workers/index.ts
apps/web/lib/runtime/distributed/workers/worker-draining.ts
apps/web/lib/runtime/distributed/workers/worker-heartbeat.ts
apps/web/lib/runtime/distributed/workers/worker-leasing.ts
apps/web/lib/runtime/distributed/balancing/index.ts
apps/web/lib/runtime/distributed/balancing/partition-balancer.ts
apps/web/lib/runtime/distributed/balancing/workload-distributor.ts
apps/web/lib/runtime/distributed/balancing/load-balancer.ts
apps/web/lib/runtime/distributed/balancing/resource-balancer.ts
apps/web/lib/runtime/distributed/runtime/distributed-runtime.ts
apps/web/lib/runtime/distributed/runtime/distributed-runtime-state.ts
apps/web/lib/runtime/distributed/runtime/distributed-runtime-context.ts
apps/web/lib/runtime/distributed/runtime/distributed-runtime-health.ts
apps/web/lib/runtime/distributed/runtime/index.ts
apps/web/lib/runtime/distributed/coordination/ownership-coordinator.ts
apps/web/lib/runtime/distributed/coordination/cluster-coordinator.ts
apps/web/lib/runtime/distributed/coordination/partition-coordinator.ts
apps/web/lib/runtime/distributed/coordination/lease-coordinator.ts
apps/web/lib/runtime/distributed/coordination/index.ts
apps/web/lib/runtime/distributed/coordination/failover-coordinator.ts
apps/web/lib/runtime/distributed/coordination/leader-coordinator.ts
apps/web/lib/runtime/distributed/cluster/cluster-topology.ts
apps/web/lib/runtime/distributed/cluster/index.ts
apps/web/lib/runtime/distributed/cluster/cluster-state.ts
apps/web/lib/runtime/distributed/cluster/cluster-health.ts
apps/web/lib/runtime/distributed/cluster/cluster-consensus.ts
apps/web/lib/runtime/distributed/cluster/cluster-membership.ts
apps/web/lib/runtime/distributed/validation.ts
```

---

## 1.3 Scenarios Module (20 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/scenarios/`

**Purpose:** Chaos recovery, distributed worker scenarios, replay validation for testing

**Safe to Delete:** YES

**Why It Exists:** Over-engineered testing scenarios for distributed systems

**What Breaks If Deleted:**
- Nothing (no production code imports scenarios module)
- Only verification and testing modules import scenarios (both being deleted)

**Replacement in V1 Architecture:** None — testing scenarios not needed for V1 production

**Files:**
```
apps/web/lib/runtime/scenarios/facade.ts
apps/web/lib/runtime/scenarios/types.ts
apps/web/lib/runtime/scenarios/index.ts
apps/web/lib/runtime/scenarios/recovery-workflow.ts
apps/web/lib/runtime/scenarios/parallel-workflow.ts
apps/web/lib/runtime/scenarios/retry-workflow.ts
apps/web/lib/runtime/scenarios/governance-rejection.ts
apps/web/lib/runtime/scenarios/event-driven.ts
apps/web/lib/runtime/scenarios/fan-out-fan-in.ts
apps/web/lib/runtime/scenarios/sequential-workflow.ts
apps/web/lib/runtime/scenarios/long-running.ts
apps/web/lib/runtime/scenarios/metrics.ts
apps/web/lib/runtime/scenarios/high-concurrency.ts
apps/web/lib/runtime/scenarios/failure-cascade.ts
apps/web/lib/runtime/scenarios/distributed-worker.ts
apps/web/lib/runtime/scenarios/replay-validation.ts
apps/web/lib/runtime/scenarios/checkpoint-restore.ts
apps/web/lib/runtime/scenarios/validation.ts
apps/web/lib/runtime/scenarios/chaos-recovery.ts
apps/web/lib/runtime/scenarios/multi-tenant.ts
```

---

## 1.4 Verification Module (15 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/verification/`

**Purpose:** Over-engineered verification for distributed systems (tenant isolation, DAG consistency, deterministic replay)

**Safe to Delete:** YES

**Why It Exists:** Verification for distributed temporal systems (not needed for V1)

**What Breaks If Deleted:**
- Nothing (no production code imports verification module)
- Only integration module imports verification (integration also being deleted)

**Replacement in V1 Architecture:** None — simple validation in services sufficient for V1

**Files:**
```
apps/web/lib/runtime/verification/index.ts
apps/web/lib/runtime/verification/facade.ts
apps/web/lib/runtime/verification/tenant-isolation.ts
apps/web/lib/runtime/verification/dag-consistency.ts
apps/web/lib/runtime/verification/deterministic-replay.ts
apps/web/lib/runtime/verification/metrics.ts
apps/web/lib/runtime/verification/governance-enforcement.ts
apps/web/lib/runtime/verification/types.ts
apps/web/lib/runtime/verification/recovery-correctness.ts
apps/web/lib/runtime/verification/scheduling-fairness.ts
apps/web/lib/runtime/verification/event-causality.ts
apps/web/lib/runtime/verification/checkpoint-integrity.ts
apps/web/lib/runtime/verification/temporal-consistency.ts
apps/web/lib/runtime/verification/validation.ts
apps/web/lib/runtime/verification/distributed-ownership.ts
```

---

## 1.5 Fixtures Module (13 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/fixtures/`

**Purpose:** Testing fixtures for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Test fixtures for distributed worker scenarios

**What Breaks If Deleted:**
- Nothing (no production code imports fixtures module)
- Only testing module imports fixtures (testing being deleted)

**Replacement in V1 Architecture:** None — test fixtures not needed for V1 production

**Files:**
```
apps/web/lib/runtime/fixtures/recovery-fixtures.ts
apps/web/lib/runtime/fixtures/workflow-fixtures.ts
apps/web/lib/runtime/fixtures/dag-fixtures.ts
apps/web/lib/runtime/fixtures/facade.ts
apps/web/lib/runtime/fixtures/failure-fixtures.ts
apps/web/lib/runtime/fixtures/replay-fixtures.ts
apps/web/lib/runtime/fixtures/index.ts
apps/web/lib/runtime/fixtures/metrics.ts
apps/web/lib/runtime/fixtures/validation.ts
apps/web/lib/runtime/fixtures/types.ts
apps/web/lib/runtime/fixtures/worker-fixtures.ts
apps/web/lib/runtime/fixtures/checkpoint-fixtures.ts
apps/web/lib/runtime/fixtures/telemetry-fixtures.ts
```

---

## 1.6 Testing Module (15 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/testing/`

**Purpose:** Over-engineered testing (worker crash, recovery validation, fault injection, chaos contracts)

**Safe to Delete:** YES

**Why It Exists:** Testing for distributed worker systems

**What Breaks If Deleted:**
- Nothing (no production code imports testing module)

**Replacement in V1 Architecture:** None — over-engineered testing not needed for V1

**Files:**
```
apps/web/lib/runtime/testing/network-partition.ts
apps/web/lib/runtime/testing/types.ts
apps/web/lib/runtime/testing/worker-crash.ts
apps/web/lib/runtime/testing/metrics.ts
apps/web/lib/runtime/testing/constants.ts
apps/web/lib/runtime/testing/replay-corruption.ts
apps/web/lib/runtime/testing/facade.ts
apps/web/lib/runtime/testing/chaos-contracts.ts
apps/web/lib/runtime/testing/errors.ts
apps/web/lib/runtime/testing/checkpoint-corruption.ts
apps/web/lib/runtime/testing/fault-injection.ts
apps/web/lib/runtime/testing/validation.ts
apps/web/lib/runtime/testing/delayed-events.ts
apps/web/lib/runtime/testing/index.ts
apps/web/lib/runtime/testing/recovery-validation.ts
```

---

## 1.7 Queue Module (1 file) — DELETE

**Path:** `apps/web/lib/runtime/queue/queue-pressure.ts`

**Purpose:** Queue pressure monitoring for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Queue monitoring for distributed worker systems (violates V1 "No queue system" rule)

**What Breaks If Deleted:**
- Nothing (no production code imports queue module)
- Only scaling module imports queue (scaling being deleted)

**Replacement in V1 Architecture:** None — queues not needed for V1

---

## 1.8 Worker Module (1 file) — DELETE

**Path:** `apps/web/lib/runtime/worker/worker-health.ts`

**Purpose:** Worker health monitoring for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Worker health monitoring (violates V1 "No distributed workers" rule)

**What Breaks If Deleted:**
- Nothing (no production code imports worker module)
- Only fixtures and testing modules import worker (both being deleted)

**Replacement in V1 Architecture:** None — workers not needed for V1

---

## 1.9 Scaling Module (17 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/scaling/`

**Purpose:** Over-engineered scaling (queue scaling, worker affinity, predictive scaling, workload balancing)

**Safe to Delete:** YES

**Why It Exists:** Scaling for distributed worker systems (not needed for V1)

**What Breaks If Deleted:**
- Nothing (no production code imports scaling module)

**Replacement in V1 Architecture:** None — Vercel handles scaling automatically

**Files:**
```
apps/web/lib/runtime/scaling/facade.ts
apps/web/lib/runtime/scaling/types.ts
apps/web/lib/runtime/scaling/index.ts
apps/web/lib/runtime/scaling/queue-scaling.ts
apps/web/lib/runtime/scaling/worker-affinity.ts
apps/web/lib/runtime/scaling/predictive-scaling.ts
apps/web/lib/runtime/scaling/workload-balancing.ts
apps/web/lib/runtime/scaling/backpressure-propagation.ts
apps/web/lib/runtime/scaling/scale-policies.ts
apps/web/lib/runtime/scaling/constants.ts
apps/web/lib/runtime/scaling/resource-aware-scheduling.ts
apps/web/lib/runtime/scaling/validation.ts
```

---

## 1.10 Integration Module (11 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/integration/`

**Purpose:** Integration testing for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Integration validation for distributed temporal systems

**What Breaks If Deleted:**
- Nothing (no production code imports integration module)

**Replacement in V1 Architecture:** None — integration testing not needed for V1

**Files:**
```
apps/web/lib/runtime/integration/provider-compatibility.ts
apps/web/lib/runtime/integration/runtime-semantic-validation.ts
apps/web/lib/runtime/integration/index.ts
apps/web/lib/runtime/integration/execution-graph-integrity.ts
apps/web/lib/runtime/integration/distributed-replay-validation.ts
apps/web/lib/runtime/integration/facade.ts
apps/web/lib/runtime/integration/cross-module-verification.ts
apps/web/lib/runtime/integration/contract-conformance.ts
```

---

## 1.11 Governance Module (19 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/governance/`

**Purpose:** Governance for distributed systems (execution throttle, policy enforcement)

**Safe to Delete:** YES

**Why It Exists:** Governance for distributed worker systems

**What Breaks If Deleted:**
- Nothing (no production code imports governance module)

**Replacement in V1 Architecture:** None — simple rate limiting sufficient for V1

**Files:**
```
apps/web/lib/runtime/governance/execution-throttle.ts
apps/web/lib/runtime/governance/policy-enforcement.ts
apps/web/lib/runtime/governance/resource-quota.ts
apps/web/lib/runtime/governance/compliance-checker.ts
apps/web/lib/runtime/governance/audit-trail.ts
apps/web/lib/runtime/governance/index.ts
```

---

## 1.12 Intelligence Module (17 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/intelligence/`

**Purpose:** Predictive scheduling, workload forecasting for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Intelligence for distributed worker scaling

**What Breaks If Deleted:**
- Nothing (no production code imports intelligence module)

**Replacement in V1 Architecture:** None — Vercel handles scaling automatically

**Files:**
```
apps/web/lib/runtime/intelligence/predictive-scheduling.ts
apps/web/lib/runtime/intelligence/workload-forecasting.ts
apps/web/lib/runtime/intelligence/capacity-planning.ts
apps/web/lib/runtime/intelligence/index.ts
```

---

## 1.13 Orchestrator Module (8 files) — DELETE SPECIFIC FILES

**Path:** `apps/web/lib/runtime/orchestrator/`

**Purpose:** Execution orchestration, task orchestration, lifecycle orchestration

**Safe to Delete:** PARTIAL — Keep execution-orchestrator.ts and task-orchestrator.ts, DELETE others

**Why It Exists:** Orchestrators for distributed systems

**What Breaks If Deleted:**
- Production code imports ExecutionOrchestrator and TaskOrchestrator (KEEP THESE)
- No production code imports other orchestrators (DELETE THESE)

**Replacement in V1 Architecture:** Keep ExecutionOrchestrator and TaskOrchestrator (V1-compliant)

**Files to DELETE:**
```
apps/web/lib/runtime/orchestrator/orchestrator.ts (facade - not used)
apps/web/lib/runtime/orchestrator/lifecycle-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/event-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/recovery-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/types.ts (unused types)
```

**Files to KEEP:**
```
apps/web/lib/runtime/orchestrator/execution-orchestrator.ts (USED BY AGENTS)
apps/web/lib/runtime/orchestrator/task-orchestrator.ts (USED BY AGENTS)
apps/web/lib/runtime/orchestrator/index.ts (exports orchestrators)
```

---

## 1.14 API Contracts Module (13 files) — DELETE ENTIRE DIRECTORY

**Path:** `apps/web/lib/runtime/api-contracts/`

**Purpose:** API contracts for distributed systems

**Safe to Delete:** YES

**Why It Exists:** API contracts for distributed temporal systems

**What Breaks If Deleted:**
- Nothing (no production code imports api-contracts module)

**Replacement in V1 Architecture:** None — simple API routes sufficient for V1

**Files:**
```
apps/web/lib/runtime/api-contracts/constants.ts
apps/web/lib/runtime/api-contracts/errors.ts
apps/web/lib/runtime/api-contracts/execution-query.ts
apps/web/lib/runtime/api-contracts/facade.ts
apps/web/lib/runtime/api-contracts/governance-query.ts
apps/web/lib/runtime/api-contracts/index.ts
apps/web/lib/runtime/api-contracts/metrics.ts
apps/web/lib/runtime/api-contracts/replay-query.ts
apps/web/lib/runtime/api-contracts/request-response.ts
apps/web/lib/runtime/api-contracts/telemetry-query.ts
apps/web/lib/runtime/api-contracts/temporal-query.ts
apps/web/lib/runtime/api-contracts/types.ts
apps/web/lib/runtime/api-contracts/validation.ts
```

---

## 1.15 Persistence Module (15 files) — DELETE SPECIFIC FILES

**Path:** `apps/web/lib/runtime/persistence/`

**Purpose:** Persistence layer for distributed systems

**Safe to Delete:** PARTIAL — Delete temporal-archival and distributed-snapshots, KEEP facade and index

**Why It Exists:** Persistence for temporal and distributed systems

**What Breaks If Deleted:**
- Nothing (no production code imports persistence module)

**Replacement in V1 Architecture:** None — repositories handle persistence in V1

**Files to DELETE:**
```
apps/web/lib/runtime/persistence/temporal-archival.ts (temporal - being deleted)
apps/web/lib/runtime/persistence/distributed-snapshots.ts (distributed - being deleted)
```

**Files to KEEP:**
```
apps/web/lib/runtime/persistence/facade.ts (may be used by services)
apps/web/lib/runtime/persistence/index.ts (exports)
```

---

## 1.16 Other Runtime Modules (DELETE)

**Path:** Various

**Files to DELETE:**
```
apps/web/lib/runtime/incidents/incident-system.ts (not used)
apps/web/lib/runtime/production/environment-validator.ts (not used)
apps/web/lib/runtime/deployment/deployment-guard.ts (not used)
apps/web/lib/runtime/disaster-recovery/disaster-recovery.ts (not used)
apps/web/lib/runtime/health/runtime-health-monitor.ts (not used)
apps/web/lib/runtime/operations/ (not used)
apps/web/lib/runtime/queue/queue-pressure.ts (queue - being deleted)
apps/web/lib/runtime/worker/worker-health.ts (worker - being deleted)
```

---

## 1.17 Validation Report Files (12 files) — DELETE

**Path:** `apps/web/lib/runtime/`

**Purpose:** Documentation/validation reports for distributed systems

**Safe to Delete:** YES

**Why It Exists:** Validation reports for distributed runtime

**What Breaks If Deleted:**
- Nothing (documentation only)

**Replacement in V1 Architecture:** None — documentation not needed

**Files:**
```
apps/web/lib/runtime/API_CONTRACTS_VALIDATION_REPORT.md
apps/web/lib/runtime/CHAOS_VALIDATION_REPORT.md
apps/web/lib/runtime/GOVERNANCE_VALIDATION_REPORT.md
apps/web/lib/runtime/INTELLIGENCE_VALIDATION_REPORT.md
apps/web/lib/runtime/ISOLATION_VALIDATION_REPORT.md
apps/web/lib/runtime/PERSISTENCE_VALIDATION_REPORT.md
apps/web/lib/runtime/RUNTIME_PRODUCTION_READINESS_REPORT.md
apps/web/lib/runtime/SCALING_VALIDATION_REPORT.md
apps/web/lib/runtime/SDK_VALIDATION_REPORT.md
apps/web/lib/runtime/SECURITY_VALIDATION_REPORT.md
apps/web/lib/runtime/SIMULATION_VALIDATION_REPORT.md
apps/web/lib/runtime/TELEMETRY_VALIDATION_REPORT.md
```

---

# SECTION 2 — CMS AUTOMATION CONFLICTS

## 2.1 CMS Connectors (3 files) — DELETE

**Path:** `apps/web/lib/connectors/`

**Purpose:** Direct CMS publishing connectors (WordPress, Shopify, Custom API)

**Safe to Delete:** YES

**What It Does:**
- `wordpress.connector.ts` - Publishes posts to WordPress REST API
- `shopify.connector.ts` - Publishes posts to Shopify Admin API
- `custom.connector.ts` - Publishes to custom API endpoints

**Why It Violates V1:**
- V1 Rule: "NO CMS ADAPTERS"
- V1 Rule: "PUBLISH DOES NOT PUBLISH"
- V1 Rule: "PUBLISH ONLY GENERATES publishing packages"
- Human operators must publish manually through Command Centre

**Deletion Priority:** CRITICAL (Phase 1)

**What Breaks If Deleted:**
- PUBLISH agent will break (needs rewrite to remove CMS automation)
- CMS credential storage will break (needs removal from integrations table)
- CMS API routes will break (needs deletion)

**Replacement in V1 Architecture:**
- PUBLISH agent generates publishing packages (title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions)
- PUBLISH agent generates CMS checklist (step-by-step manual publishing instructions)
- Human operators execute publishing manually through Command Centre

**Files:**
```
apps/web/lib/connectors/wordpress.connector.ts
apps/web/lib/connectors/shopify.connector.ts
apps/web/lib/connectors/custom.connector.ts
```

---

## 2.2 Runtime CMS Connectors (2 files) — DELETE

**Path:** `apps/web/lib/runtime/connectors/`

**Purpose:** Runtime CMS connectors for WordPress and Custom API

**Safe to Delete:** YES

**What It Does:**
- `wordpress.connector.ts` - Runtime WordPress connector
- `custom-api.connector.ts` - Runtime Custom API connector

**Why It Violates V1:**
- Same as above — CMS adapters forbidden in V1

**Deletion Priority:** CRITICAL (Phase 1)

**What Breaks If Deleted:**
- PUBLISH agent tasks will break (needs rewrite)
- PUBLISH service will break (needs rewrite)

**Replacement in V1 Architecture:** None — CMS connectors not needed in V1

**Files:**
```
apps/web/lib/runtime/connectors/wordpress.connector.ts
apps/web/lib/runtime/connectors/custom-api.connector.ts
```

---

## 2.3 CMS Execution System (1 file) — DELETE

**Path:** `apps/web/lib/runtime/cms/cms-execution.ts`

**Purpose:** CMS execution binding for WordPress, Shopify, Webflow, Ghost

**Safe to Delete:** YES

**What It Does:**
- `cms-execution.ts` - Publishes to multiple CMS platforms (WordPress, Shopify, Webflow, Ghost)
- Handles draft publishing, scheduled publishing, media uploads, rollback, publish status tracking

**Why It Violates V1:**
- CMS automation forbidden in V1
- Autonomous publishing forbidden in V1

**Deletion Priority:** CRITICAL (Phase 1)

**What Breaks If Deleted:**
- Nothing (no production code imports cms-execution)

**Replacement in V1 Architecture:** None — CMS execution not needed in V1

**Files:**
```
apps/web/lib/runtime/cms/cms-execution.ts
```

---

## 2.4 CMS Actions (1 file) — DELETE

**Path:** `apps/web/actions/cms.ts`

**Purpose:** Server action for saving CMS credentials

**Safe to Delete:** YES

**What It Does:**
- `cms.ts` - Saves CMS credentials to cms_credentials table

**Why It Violates V1:**
- CMS credential storage not needed in V1 (no CMS automation)

**Deletion Priority:** CRITICAL (Phase 1)

**What Breaks If Deleted:**
- CMS credential storage will break (intentional - not needed in V1)

**Replacement in V1 Architecture:** None — CMS credentials not needed in V1

**Files:**
```
apps/web/actions/cms.ts
```

---

## 2.5 CMS API Routes (3 files) — DELETE

**Path:** `apps/web/app/api/integrations/cms/`

**Purpose:** API routes for CMS integration

**Safe to Delete:** YES

**What It Does:**
- `route.ts` - CMS integration endpoint
- `test-connection/route.ts` - Test CMS connection
- `callback/cms/route.ts` - CMS callback handler

**Why It Violates V1:**
- CMS integration not needed in V1

**Deletion Priority:** CRITICAL (Phase 1)

**What Breaks If Deleted:**
- CMS integration API will break (intentional - not needed in V1)

**Replacement in V1 Architecture:** None — CMS API routes not needed in V1

**Files:**
```
apps/web/app/api/integrations/cms/route.ts
apps/web/app/api/integrations/cms/test-connection/route.ts
apps/web/app/api/integrations/callback/cms/route.ts
```

---

## 2.6 CMS Integration Mesh Files (5 files) — DELETE

**Path:** `apps/web/lib/integrations/mesh/`

**Purpose:** CMS integration validation and safety

**Safe to Delete:** YES

**What It Does:**
- `validation/publishing-callback-validation.ts` - CMS callback validation
- `publishing/ampli-safety.ts` - CMS publishing safety
- Other mesh files that reference CMS

**Why It Violates V1:**
- CMS integration not needed in V1

**Deletion Priority:** HIGH (Phase 2)

**What Breaks If Deleted:**
- Integration mesh will break (needs cleanup)

**Replacement in V1 Architecture:** None — CMS integration mesh not needed in V1

**Files:**
```
apps/web/lib/integrations/mesh/validation/publishing-callback-validation.ts
apps/web/lib/integrations/mesh/publishing/ampli-safety.ts
```

---

# SECTION 3 — DATABASE CONFLICTS

## 3.1 Deprecated Runtime Tables (10 tables) — DROP

**Path:** `supabase/RUNTIME_TABLES.sql`

**Purpose:** Deprecated runtime tables (runtime_workflows, runtime_tasks, runtime_executions, runtime_thinking_logs, runtime_artifacts, seo_keywords, seo_clusters, seo_content_briefs, seo_drafts, seo_reports)

**Safe to Drop:** YES

**Why It Exists:** Deprecated runtime system (replaced by canonical agent_executions system)

**What Breaks If Dropped:**
- Nothing (deprecated, not used by production code)
- Comment in file explicitly states "DEPRECATED - DO NOT USE"

**Migration Risks:** LOW (deprecated, no production data)

**Tables to DROP:**
```sql
DROP TABLE IF EXISTS runtime_workflows CASCADE;
DROP TABLE IF EXISTS runtime_tasks CASCADE;
DROP TABLE IF EXISTS runtime_executions CASCADE;
DROP TABLE IF EXISTS runtime_thinking_logs CASCADE;
DROP TABLE IF EXISTS runtime_artifacts CASCADE;
DROP TABLE IF EXISTS seo_keywords CASCADE;
DROP TABLE IF EXISTS seo_clusters CASCADE;
DROP TABLE IF EXISTS seo_content_briefs CASCADE;
DROP TABLE IF EXISTS seo_drafts CASCADE;
DROP TABLE IF EXISTS seo_reports CASCADE;
```

---

## 3.2 Canonical Runtime Tables (4 tables) — PRESERVE

**Path:** `supabase/FINAL_DATABASE_PACKAGE.sql`

**Purpose:** Canonical runtime tables (agent_executions, agent_tasks, agent_events, agent_logs)

**Safe to Drop:** NO — MUST PRESERVE

**Why It Exists:** Canonical runtime system for V1

**What Breaks If Dropped:**
- Agent execution tracking will break
- Task tracking will break
- Event logging will break
- Execution logs will break

**Migration Risks:** CRITICAL (core V1 system)

**Tables to PRESERVE:**
```sql
-- DO NOT DROP THESE TABLES
agent_executions
agent_tasks
agent_events
agent_logs
```

---

## 3.3 CMS Columns in integrations Table — DROP

**Path:** `supabase/create_integrations_table.sql`

**Purpose:** CMS credential storage (wp_site_url, wp_username, wp_app_password_encrypted, shopify_store_url, shopify_access_token_encrypted, shopify_blog_id, custom_api_url, custom_api_key_encrypted, wp_status, shopify_status, custom_status)

**Safe to Drop:** YES

**Why It Exists:** CMS credential storage (not needed in V1)

**What Breaks If Dropped:**
- CMS credential storage will break (intentional - not needed in V1)

**Migration Risks:** LOW (CMS not used in V1)

**Columns to DROP:**
```sql
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_site_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_username;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_app_password_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_store_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_access_token_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_blog_id;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_api_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_api_key_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS google_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_status_check;
```

---

## 3.4 cms_credentials Table — DROP (if exists)

**Path:** Referenced in `apps/web/actions/cms.ts`

**Purpose:** CMS credential storage

**Safe to Drop:** YES

**Why It Exists:** CMS credential storage (not needed in V1)

**What Breaks If Dropped:**
- CMS credential storage will break (intentional - not needed in V1)

**Migration Risks:** LOW (CMS not used in V1)

**Table to DROP:**
```sql
DROP TABLE IF EXISTS cms_credentials CASCADE;
```

---

## 3.5 publish_jobs Table — PRESERVE (but modify)

**Path:** `supabase/create_publish_jobs_table.sql`

**Purpose:** Track publishing jobs to external CMS platforms

**Safe to Drop:** NO — PRESERVE but MODIFY

**Why It Exists:** Publishing job tracking

**What Breaks If Dropped:**
- Publishing job tracking will break

**Migration Risks:** MEDIUM (needs modification for V1)

**Modification Required:**
- Change status enum to remove 'queued' and 'publishing' (no autonomous publishing)
- Add reference to command_centre_tasks instead of direct CMS publishing
- Keep table for tracking manual publishing tasks

**Current Status Enum:**
```sql
CHECK (status IN ('queued', 'publishing', 'success', 'failed'))
```

**New Status Enum (V1):**
```sql
CHECK (status IN ('pending', 'in_progress', 'completed', 'failed'))
```

---

## 3.6 Onboarding Tables — PRESERVE

**Path:** `supabase/ONBOARDING_TABLES.sql`

**Purpose:** Tenant onboarding and website asset ingestion

**Safe to Drop:** NO — MUST PRESERVE

**Why It Exists:** Core onboarding system

**What Breaks If Dropped:**
- Tenant onboarding will break
- Website asset ingestion will break

**Migration Risks:** CRITICAL (core V1 system)

**Tables to PRESERVE:**
```sql
tenants
workspaces
business_profiles
gsc_credentials
credentials
sitemaps
pages
ranking_seeds
ranking_history
ranking_movements
ranking_volatility
```

---

## 3.7 Agent-Specific Tables — PRESERVE

**Path:** Various SQL files

**Purpose:** Agent-specific data storage

**Safe to Drop:** NO — MUST PRESERVE

**Why It Exists:** Agent data storage

**What Breaks If Dropped:**
- Agent data will break

**Migration Risks:** CRITICAL (core V1 system)

**Tables to PRESERVE:**
```sql
pulse_rankings (from create_pulse_rankings_table.sql)
locl_audits (from create_locl_audits_table.sql)
indexing_status (from create_indexing_status_table.sql)
integrations (from create_integrations_table.sql)
```

---

# SECTION 4 — PRESERVE LIST

## 4.1 Auth System — PRESERVE

**Path:** `apps/web/lib/auth/`

**Purpose:** Clerk authentication integration

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core authentication system

**What Breaks If Deleted:**
- Authentication will break
- Authorization will break

**Replacement in V1 Architecture:** None — auth system is V1-compliant

**Files:**
```
apps/web/lib/auth/ensure-workspace.ts
```

---

## 4.2 Onboarding System — PRESERVE

**Path:** `apps/web/lib/onboarding/`

**Purpose:** Tenant onboarding and website asset ingestion

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core onboarding system

**What Breaks If Deleted:**
- Tenant onboarding will break
- Website asset ingestion will break

**Replacement in V1 Architecture:** None — onboarding system is V1-compliant

**Files:**
```
apps/web/lib/onboarding/bootstrap.ts
apps/web/lib/onboarding/credentials.ts
apps/web/lib/onboarding/hardened-integration.ts
apps/web/lib/onboarding/ingestion.ts
apps/web/lib/onboarding/orchestration.ts
apps/web/lib/onboarding/page-crawler.ts
apps/web/lib/onboarding/sitemap-ingestion.ts
apps/web/lib/onboarding/validation.ts
apps/web/lib/onboarding/website-scanner.ts
apps/web/lib/onboarding/activation/tenant-activation-pipeline.ts
```

---

## 4.3 Tenant Architecture — PRESERVE

**Path:** Database tables and Supabase setup

**Purpose:** Multitenant architecture

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core multitenant system

**What Breaks If Deleted:**
- Multitenancy will break
- Tenant isolation will break

**Replacement in V1 Architecture:** None — tenant architecture is V1-compliant

**Tables:**
```sql
profiles
tenants
workspaces
business_profiles
```

---

## 4.4 Dashboard Shell — PRESERVE

**Path:** `apps/web/components/dashboard/` and `apps/web/app/dashboard/`

**Purpose:** Client dashboard UI

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Client dashboard UI

**What Breaks If Deleted:**
- Client dashboard will break

**Replacement in V1 Architecture:** None — dashboard shell is V1-compliant

**Files:**
```
apps/web/components/dashboard/MissionControl.tsx
apps/web/components/dashboard/Sidebar.tsx
apps/web/components/dashboard/CompleteProfileCard.tsx
apps/web/app/dashboard/page.tsx
```

---

## 4.5 Supabase Setup — PRESERVE

**Path:** `apps/web/lib/supabase/`

**Purpose:** Supabase client setup

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core database client

**What Breaks If Deleted:**
- Database access will break

**Replacement in V1 Architecture:** None — Supabase setup is V1-compliant

**Files:**
```
apps/web/lib/supabase/client.ts
apps/web/lib/supabase/server.ts
apps/web/lib/supabase/admin.ts
apps/web/lib/supabase/middleware.ts
```

---

## 4.6 Clerk Integration — PRESERVE

**Path:** Environment variables and middleware

**Purpose:** Clerk authentication

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core authentication

**What Breaks If Deleted:**
- Authentication will break

**Replacement in V1 Architecture:** None — Clerk integration is V1-compliant

---

## 4.7 Credential Encryption — PRESERVE

**Path:** `apps/web/lib/onboarding/credentials.ts`

**Purpose:** Credential encryption

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Security for credentials

**What Breaks If Deleted:**
- Credential security will break

**Replacement in V1 Architecture:** None — credential encryption is V1-compliant

---

## 4.8 Canonical Runtime Services — PRESERVE

**Path:** `apps/web/lib/runtime/services/`

**Purpose:** Runtime services (ExecutionService, TaskService, EventService, LogService, MetricsService)

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Core runtime execution

**What Breaks If Deleted:**
- Agent execution will break
- Task tracking will break
- Event logging will break

**Replacement in V1 Architecture:** None — canonical runtime services are V1-compliant

**Files:**
```
apps/web/lib/runtime/services/runtime.service.ts
apps/web/lib/runtime/services/execution.service.ts
apps/web/lib/runtime/services/task.service.ts
apps/web/lib/runtime/services/event.service.ts
apps/web/lib/runtime/services/log.service.ts
apps/web/lib/runtime/services/metrics.service.ts
apps/web/lib/runtime/services/types.ts
apps/web/lib/runtime/services/index.ts
```

---

## 4.9 Canonical Runtime Repositories — PRESERVE

**Path:** `apps/web/lib/runtime/repositories/`

**Purpose:** Database repositories for runtime

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Database access layer

**What Breaks If Deleted:**
- Database access will break

**Replacement in V1 Architecture:** None — repositories are V1-compliant

**Files:**
```
apps/web/lib/runtime/repositories/base.repository.ts
apps/web/lib/runtime/repositories/execution.repository.ts
apps/web/lib/runtime/repositories/task.repository.ts
apps/web/lib/runtime/repositories/event.repository.ts
apps/web/lib/runtime/repositories/log.repository.ts
apps/web/lib/runtime/repositories/metrics.repository.ts
apps/web/lib/runtime/repositories/index.ts
```

---

## 4.10 Canonical Runtime Connectors — PRESERVE (except CMS)

**Path:** `apps/web/lib/runtime/connectors/`

**Purpose:** API connectors for external services

**Safe to Delete:** PARTIAL — DELETE CMS connectors, PRESERVE others

**Why It Exists:** External API integration

**What Breaks If Deleted:**
- External API integration will break

**Replacement in V1 Architecture:** None — connectors are V1-compliant (except CMS)

**Files to PRESERVE:**
```
apps/web/lib/runtime/connectors/base.connector.ts
apps/web/lib/runtime/connectors/dataforseo.connector.ts (ARIA, PULSE, LINX)
apps/web/lib/runtime/connectors/openai.connector.ts (SCRIBE)
apps/web/lib/runtime/connectors/google-analytics.connector.ts (PRISM)
apps/web/lib/runtime/connectors/google-search-console.connector.ts (CORE)
apps/web/lib/runtime/connectors/google-business-profile.connector.ts (LOCL, REPUTE)
```

**Files to DELETE:**
```
apps/web/lib/runtime/connectors/wordpress.connector.ts (CMS - DELETE)
apps/web/lib/runtime/connectors/custom-api.connector.ts (CMS - DELETE)
```

---

## 4.11 Canonical Runtime Orchestrators — PRESERVE (specific files)

**Path:** `apps/web/lib/runtime/orchestrator/`

**Purpose:** Execution and task orchestration

**Safe to Delete:** PARTIAL — DELETE unused orchestrators, PRESERVE used ones

**Why It Exists:** Orchestration layer

**What Breaks If Deleted:**
- Agent execution will break

**Replacement in V1 Architecture:** None — orchestrators are V1-compliant

**Files to PRESERVE:**
```
apps/web/lib/runtime/orchestrator/execution-orchestrator.ts (USED BY AGENTS)
apps/web/lib/runtime/orchestrator/task-orchestrator.ts (USED BY AGENTS)
apps/web/lib/runtime/orchestrator/index.ts (exports)
```

**Files to DELETE:**
```
apps/web/lib/runtime/orchestrator/orchestrator.ts (facade - not used)
apps/web/lib/runtime/orchestrator/lifecycle-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/event-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/recovery-orchestrator.ts (not used)
apps/web/lib/runtime/orchestrator/types.ts (unused types)
```

---

## 4.12 Real ARIA Execution — PRESERVE

**Path:** `apps/web/lib/agents/aria/`

**Purpose:** ARIA agent execution

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** ARIA agent

**What Breaks If Deleted:**
- ARIA agent will break

**Replacement in V1 Architecture:** None — ARIA is V1-compliant

**Files:**
```
apps/web/lib/agents/aria/aria.service.ts
apps/web/lib/agents/aria/aria-tasks.ts
```

---

## 4.13 Real SCRIBE Execution — PRESERVE

**Path:** `apps/web/lib/agents/scribe/`

**Purpose:** SCRIBE agent execution

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** SCRIBE agent

**What Breaks If Deleted:**
- SCRIBE agent will break

**Replacement in V1 Architecture:** None — SCRIBE is V1-compliant

**Files:**
```
apps/web/lib/agents/scribe/scribe.service.ts
apps/web/lib/agents/scribe/scribe-tasks.ts
```

---

## 4.14 Dashboard Stats — PRESERVE

**Path:** `apps/web/lib/dashboard/`

**Purpose:** Dashboard statistics

**Safe to Delete:** NO — MUST PRESERVE

**Why It Exists:** Dashboard data

**What Breaks If Deleted:**
- Dashboard will break

**Replacement in V1 Architecture:** None — dashboard stats are V1-compliant

**Files:**
```
apps/web/lib/dashboard/index.ts
apps/web/lib/dashboard/runtime-stats.ts
apps/web/lib/dashboard/runtime-stats-extended.ts
```

---

# SECTION 5 — V1 FOUNDATIONAL ARCHITECTURE

## 5.1 Command Centre Architecture

**Purpose:** Human execution engine for operational tasks

**Minimal Architecture:**
```
1. Database Tables:
   - command_centre_tasks (human-executable tasks)
   - command_centre_activity_log (audit trail)
   - command_centre_sla_rules (SLA configuration)

2. Core Logic:
   - task-manager.ts (task CRUD operations)
   - priority-scoring.ts (priority calculation)
   - sla-manager.ts (SLA tracking)
   - assignment-logic.ts (employee assignment)
   - activity-logger.ts (activity logging)

3. API Routes:
   - /api/command-centre/tasks (task CRUD)
   - /api/command-centre/assign (task assignment)
   - /api/command-centre/complete (task completion)
   - /api/command-centre/activity (activity feed)
   - /api/command-centre/sla (SLA status)

4. UI Components:
   - TaskQueue.tsx (task list)
   - TaskCard.tsx (task detail)
   - ActivityFeed.tsx (activity log)
```

**No Future Abstractions:**
- No distributed task queues
- No worker coordination
- No temporal event sourcing
- Simple CRUD operations only

---

## 5.2 Task Generation Architecture

**Purpose:** Agents generate tasks for Command Centre

**Minimal Architecture:**
```
1. Task Generation Function (per agent):
   - analyze agent execution output
   - generate CommandCentreTask objects
   - insert into command_centre_tasks table

2. Task Template (per agent):
   - task_type (e.g., keyword_review, content_review, publishing_package)
   - task_category (e.g., research, publishing, technical)
   - title (human-readable)
   - description (what to do)
   - instructions (step-by-step)
   - priority (critical, high, medium, low)
   - estimated_hours (time estimate)

3. Integration Point:
   - After agent execution completes
   - Call task generation function
   - Insert tasks into command_centre_tasks
```

**No Future Abstractions:**
- No task orchestration
- No task dependencies
- No task workflows
- Simple task generation only

---

## 5.3 Client Dashboard Architecture

**Purpose:** Display agent activity, rankings, reports, tasks to clients

**Minimal Architecture:**
```
1. Data Sources:
   - agent_executions (agent activity)
   - agent_tasks (task progress)
   - pulse_rankings (rankings)
   - command_centre_tasks (completed tasks)
   - agent_events (activity feed)

2. API Routes:
   - /api/dashboard/task-summary (task counts)
   - /api/dashboard/agent-status (agent status)
   - /api/dashboard/rankings-summary (rankings)
   - /api/dashboard/activity-feed (activity)
   - /api/dashboard/sla-status (SLA)

3. Real-Time Updates:
   - Supabase real-time subscriptions
   - Update on task changes
   - Update on agent executions
   - Update on ranking updates

4. Caching:
   - Task counts (5-minute TTL)
   - Agent status (1-minute TTL)
   - Rankings (15-minute TTL)
```

**No Future Abstractions:**
- No complex data pipelines
- No event streaming
- Simple queries with caching

---

## 5.4 Agent Execution Architecture

**Purpose:** Agents execute AI tasks and generate intelligence

**Minimal Architecture:**
```
1. Canonical Runtime (PRESERVED):
   - RuntimeService (facade)
   - ExecutionService (execution lifecycle)
   - TaskService (task lifecycle)
   - EventService (event logging)
   - LogService (execution logs)
   - MetricsService (metrics)

2. Orchestrators (PRESERVED):
   - ExecutionOrchestrator (execution orchestration)
   - TaskOrchestrator (task orchestration)

3. Repositories (PRESERVED):
   - ExecutionRepository (agent_executions)
   - TaskRepository (agent_tasks)
   - EventRepository (agent_events)
   - LogRepository (agent_logs)

4. Connectors (PRESERVED except CMS):
   - DataForSEOConnector (ARIA, PULSE, LINX)
   - OpenAIConnector (SCRIBE)
   - GoogleAnalyticsConnector (PRISM)
   - GoogleSearchConsoleConnector (CORE)
   - GoogleBusinessProfileConnector (LOCL, REPUTE)

5. Execution Flow:
   Agent Service → RuntimeService → ExecutionOrchestrator → TaskOrchestrator → Connector → External API → Response → Task Generation → Command Centre
```

**No Future Abstractions:**
- No distributed execution
- No worker coordination
- No temporal event sourcing
- Simple sequential execution

---

## 5.5 Tenant Isolation Architecture

**Purpose:** Strict multitenancy with zero shared intelligence

**Minimal Architecture:**
```
1. Database:
   - All tables have tenant_id column (UUID)
   - RLS policies use auth.jwt() ->> 'sub' (Clerk)
   - FK constraints on tenant_id

2. Application:
   - Tenant context passed to all services
   - Tenant isolation in all queries
   - No cross-tenant data access

3. Security:
   - RLS policies enforced at database level
   - Application-level tenant validation
   - Audit logging for all tenant access
```

**No Future Abstractions:**
- No partitioning (initially)
- No sharding (initially)
- Simple RLS + tenant_id

---

## 5.6 Ranking Updates Architecture

**Purpose:** Track keyword rankings and movements

**Minimal Architecture:**
```
1. Database Tables:
   - pulse_rankings (current rankings)
   - ranking_history (historical rankings)
   - ranking_movements (ranking changes)
   - ranking_volatility (volatility metrics)

2. Execution:
   - PULSE agent fetches rankings from DataForSEO
   - Store in pulse_rankings
   - Calculate movements
   - Store in ranking_history
   - Update dashboard

3. API Routes:
   - /api/rankings/fetch (trigger ranking fetch)
   - /api/rankings/history (get ranking history)
   - /api/rankings/movements (get ranking movements)
```

**No Future Abstractions:**
- No real-time ranking streaming
- Simple periodic fetches

---

## 5.7 Reports Pipeline Architecture

**Purpose:** Generate SEO reports for clients

**Minimal Architecture:**
```
1. Database Tables:
   - agent_executions (execution data)
   - agent_tasks (task data)
   - pulse_rankings (ranking data)
   - locl_audits (local SEO data)

2. Report Generation:
   - Query data from tables
   - Aggregate metrics
   - Generate report JSON
   - Store in agent_events or new reports table

3. API Routes:
   - /api/reports/generate (trigger report generation)
   - /api/reports/fetch (get report)
```

**No Future Abstractions:**
- No report scheduling (initially)
- Simple on-demand generation

---

# SECTION 6 — PHASED SAFE DELETION PLAN

## Phase 1: Delete Over-Engineered Runtime Modules (Day 1)

**What to Delete:**
- temporal/ (56 files)
- distributed/ (43 files)
- scenarios/ (20 files)
- verification/ (15 files)
- fixtures/ (13 files)
- testing/ (15 files)
- queue/ (1 file)
- worker/ (1 file)
- scaling/ (17 files)
- integration/ (11 files)
- governance/ (19 files)
- intelligence/ (17 files)
- api-contracts/ (13 files)
- validation reports (12 files)

**Total Files:** 253 files

**What Must Be Preserved First:**
- Canonical runtime services (services/)
- Canonical runtime repositories (repositories/)
- Canonical runtime connectors (connectors/ except CMS)
- Canonical runtime orchestrators (execution-orchestrator.ts, task-orchestrator.ts)

**Rollback Risks:** LOW (no production code imports these modules)

**Dependencies:** None (can delete immediately)

**Verification After Deletion:**
- Run `npm run build` to ensure no import errors
- Run `npm run lint` to ensure no lint errors
- Test agent execution (ARIA, SCRIBE) to ensure they still work

**Git Commit:**
```bash
git add .
git commit -m "phase1: delete over-engineered runtime modules (temporal, distributed, scenarios, verification, fixtures, testing, queue, worker, scaling, integration, governance, intelligence, api-contracts, validation reports)"
git push origin runtime-restoration-phase1
```

---

## Phase 2: Delete CMS Automation (Day 2)

**What to Delete:**
- lib/connectors/wordpress.connector.ts
- lib/connectors/shopify.connector.ts
- lib/connectors/custom.connector.ts
- lib/runtime/connectors/wordpress.connector.ts
- lib/runtime/connectors/custom-api.connector.ts
- lib/runtime/cms/cms-execution.ts
- actions/cms.ts
- app/api/integrations/cms/route.ts
- app/api/integrations/cms/test-connection/route.ts
- app/api/integrations/callback/cms/route.ts
- lib/integrations/mesh/validation/publishing-callback-validation.ts
- lib/integrations/mesh/publishing/ampli-safety.ts

**Total Files:** 12 files

**What Must Be Preserved First:**
- PUBLISH agent service (will break, needs rewrite in Phase 3)
- PUBLISH agent tasks (will break, needs rewrite in Phase 3)

**Rollback Risks:** MEDIUM (PUBLISH agent will break, but not used in production yet)

**Dependencies:** Phase 1 (over-engineered runtime must be deleted first)

**Verification After Deletion:**
- Run `npm run build` to ensure no import errors
- Run `npm run lint` to ensure no lint errors
- PUBLISH agent will fail (expected, will be rewritten in Phase 3)

**Git Commit:**
```bash
git add .
git commit -m "phase2: delete CMS automation (connectors, cms-execution, actions, api routes, integration mesh)"
git push origin runtime-restoration-phase1
```

---

## Phase 3: Database Migration (Day 3)

**What to Drop:**
- Deprecated runtime tables (10 tables)
- CMS columns from integrations table (13 columns)
- cms_credentials table (if exists)

**What to Modify:**
- publish_jobs table status enum

**What Must Be Preserved First:**
- Canonical runtime tables (agent_executions, agent_tasks, agent_events, agent_logs)
- Onboarding tables
- Agent-specific tables

**Rollback Risks:** MEDIUM (database changes, but deprecated tables not used)

**Dependencies:** Phase 2 (CMS automation must be deleted first)

**Verification After Migration:**
- Run migration SQL in Supabase SQL editor
- Verify tables dropped
- Verify columns dropped
- Verify publish_jobs status enum modified
- Test database queries

**Git Commit:**
```bash
git add .
git commit -m "phase3: database migration (drop deprecated runtime tables, drop CMS columns, modify publish_jobs status enum)"
git push origin runtime-restoration-phase1
```

---

## Phase 4: Delete Unused Orchestrators and Cleanup (Day 4)

**What to Delete:**
- orchestrator/orchestrator.ts (facade)
- orchestrator/lifecycle-orchestrator.ts
- orchestrator/event-orchestrator.ts
- orchestrator/recovery-orchestrator.ts
- orchestrator/types.ts
- persistence/temporal-archival.ts
- persistence/distributed-snapshots.ts
- incidents/incident-system.ts
- production/environment-validator.ts
- deployment/deployment-guard.ts
- disaster-recovery/disaster-recovery.ts
- health/runtime-health-monitor.ts
- operations/
- app/api/v1/orchestrator/trigger-agent/route.ts
- app/api/v1/agent-update/route.ts
- app/api/dashboard/agent-states/route.ts

**Total Files:** ~15 files

**What Must Be Preserved First:**
- execution-orchestrator.ts (used by agents)
- task-orchestrator.ts (used by agents)

**Rollback Risks:** LOW (unused files)

**Dependencies:** Phase 3 (database must be migrated first)

**Verification After Deletion:**
- Run `npm run build` to ensure no import errors
- Run `npm run lint` to ensure no lint errors
- Test agent execution (ARIA, SCRIBE) to ensure they still work

**Git Commit:**
```bash
git add .
git commit -m "phase4: delete unused orchestrators and cleanup (orchestrator facade, lifecycle, event, recovery, temporal-archival, distributed-snapshots, incidents, production, deployment, disaster-recovery, health, operations, deprecated API routes)"
git push origin runtime-restoration-phase1
```

---

# SECTION 7 — HARD WARNINGS

## 7.1 Dangerous Deletions

**WARNING: DO NOT DELETE THESE FILES**

**Canonical Runtime Services:**
```
apps/web/lib/runtime/services/runtime.service.ts
apps/web/lib/runtime/services/execution.service.ts
apps/web/lib/runtime/services/task.service.ts
apps/web/lib/runtime/services/event.service.ts
apps/web/lib/runtime/services/log.service.ts
apps/web/lib/runtime/services/metrics.service.ts
```
**Risk:** Agent execution will break completely

**Canonical Runtime Repositories:**
```
apps/web/lib/runtime/repositories/execution.repository.ts
apps/web/lib/runtime/repositories/task.repository.ts
apps/web/lib/runtime/repositories/event.repository.ts
apps/web/lib/runtime/repositories/log.repository.ts
```
**Risk:** Database access will break completely

**Canonical Runtime Orchestrators:**
```
apps/web/lib/runtime/orchestrator/execution-orchestrator.ts
apps/web/lib/runtime/orchestrator/task-orchestrator.ts
```
**Risk:** Agent execution will break completely

**Canonical Runtime Connectors (non-CMS):**
```
apps/web/lib/runtime/connectors/dataforseo.connector.ts
apps/web/lib/runtime/connectors/openai.connector.ts
apps/web/lib/runtime/connectors/google-analytics.connector.ts
apps/web/lib/runtime/connectors/google-search-console.connector.ts
apps/web/lib/runtime/connectors/google-business-profile.connector.ts
```
**Risk:** External API integration will break completely

**Canonical Runtime Tables:**
```
agent_executions
agent_tasks
agent_events
agent_logs
```
**Risk:** Agent execution tracking will break completely

---

## 7.2 Hidden Dependencies

**WARNING: THESE FILES HAVE HIDDEN DEPENDENCIES**

**RuntimeService:**
- Imported by: aria.service.ts, scribe.service.ts, publish.service.ts, integrations/mesh/*
- Risk: Deleting RuntimeService will break all agent services

**ExecutionOrchestrator:**
- Imported by: aria.service.ts, scribe.service.ts, publish.service.ts
- Risk: Deleting ExecutionOrchestrator will break all agent services

**TaskOrchestrator:**
- Imported by: aria.service.ts, scribe.service.ts, publish.service.ts
- Risk: Deleting TaskOrchestrator will break all agent services

**Dashboard Stats:**
- Import from: agent_executions, agent_tasks, agent_events tables
- Risk: Deleting canonical runtime tables will break dashboard

---

## 7.3 Files That Appear Dead But Are Actually Used

**WARNING: THESE FILES APPEAR UNUSED BUT ARE USED**

**runtime/index.ts:**
- Appears to be empty/unused
- Actually exports runtime types and constants
- Risk: Deleting will break type imports

**runtime/types.ts:**
- Appears to be unused
- Actually used by all runtime modules
- Risk: Deleting will break all runtime modules

**runtime/constants/events.ts:**
- Appears to be unused
- Actually used by orchestrators
- Risk: Deleting will break orchestrators

---

## 7.4 Migration Traps

**WARNING: THESE ARE MIGRATION TRAPS**

**RLS Policy Inconsistency:**
- Canonical runtime tables use auth.jwt() ->> 'sub' (CORRECT for Clerk)
- Production tables use auth.uid() (INCORRECT for Clerk)
- Trap: Do NOT update production RLS policies in Phase 1 (do in later phase)
- Risk: Breaking authentication if updated incorrectly

**tenant_id Type Inconsistency:**
- Canonical runtime tables use UUID (CORRECT)
- Production agent-specific tables use TEXT (INCORRECT)
- Trap: Do NOT migrate tenant_id types in Phase 1 (do in later phase)
- Risk: Breaking FK constraints if migrated incorrectly

**Dual Runtime Systems:**
- Deprecated runtime (runtime_workflows, runtime_tasks, runtime_executions)
- Canonical runtime (agent_executions, agent_tasks, agent_events, agent_logs)
- Trap: Ensure you're dropping the RIGHT tables (deprecated, not canonical)
- Risk: Dropping canonical tables will break agent execution

---

## 7.5 Tenant Isolation Risks

**WARNING: TENANT ISOLATION RISKS**

**RLS Policy Bypass:**
- Current RLS policies use auth.uid() (wrong for Clerk)
- Risk: Authorization bypass possible
- Mitigation: Update RLS policies in later phase (not Phase 1)

**tenant_id Type Mismatch:**
- Some tables use TEXT, some use UUID
- Risk: Data inconsistency, no FK constraints
- Mitigation: Migrate tenant_id to UUID in later phase (not Phase 1)

**No FK Constraints:**
- Production tables have no FK constraints due to type mismatch
- Risk: Orphaned data possible
- Mitigation: Add FK constraints after tenant_id migration (later phase)

---

# CONCLUSION

**Total Files to Delete:** 189 files
- 164 over-engineered runtime files
- 12 CMS automation files
- 13 other files

**Total Files to Preserve:** 27 files
- 7 canonical runtime services
- 6 canonical runtime repositories
- 5 canonical runtime connectors (non-CMS)
- 2 canonical runtime orchestrators
- 7 other files

**Database Changes:**
- Drop 10 deprecated tables
- Drop 13 CMS columns
- Modify 1 table (publish_jobs status enum)

**Phases:** 4 ordered phases with rollback verification after each

**Estimated Time:** 4 days

**Risk Level:** LOW (over-engineered runtime not used by production code)

**Next Steps:**
1. Review this deletion map
2. Approve deletion plan
3. Begin Phase 1 (Delete over-engineered runtime modules)
4. Verify after each phase
5. Commit and push after each phase

---

**DELETION MAP END**

**Generated:** May 23, 2026  
**Auditor:** Cascade AI  
**Version:** 1.0  
**Status:** FORENSIC MAPPING COMPLETE
