# CLAUX Runtime Transaction & Locking Foundation Architecture Plan

**Plan Date:** 2025-01-20
**Plan Scope:** Canonical runtime concurrency foundation architecture
**Plan Status:** COMPLETE
**Target:** Single-node execution integrity foundations

---

## 1. Executive Summary

This architecture plan defines the canonical concurrency model for the CLAUX runtime stack, addressing the critical gaps identified in TASK 5B.1 (Runtime Concurrency Investigation Audit). The plan establishes transaction ownership, locking strategy, optimistic concurrency, atomic state transitions, deduplication, retry consistency, and event consistency while preserving runtime sovereignty and canonical execution authority.

### Architecture Principles

**Canonical Authority Preservation:**
- RuntimeService remains the single entry point for execution operations
- ExecutionService and TaskService own state transition logic
- Repository layer remains pure data access with transaction participation
- Orchestrators coordinate but do not own transactions
- Connectors remain pure provider adapters

**Transaction Ownership Centralization:**
- Service layer owns transaction boundaries
- Repository layer participates in transactions but does not initiate
- No transaction ownership fragmentation
- Single transaction strategy across all runtime operations

**Locking Strategy Centralization:**
- Database-level locking for critical operations
- Optimistic concurrency for state updates
- Advisory locks for cross-transaction coordination
- No application-level lock ownership fragmentation

**State Machine Integrity:**
- Atomic state transitions via database constraints
- Validation + mutation in single operation
- State machine enforcement at database layer
- No invalid state transitions possible

### Architecture Decisions Summary

| Decision Area | Canonical Strategy | Owner |
|---------------|-------------------|-------|
| Transaction Ownership | Service layer initiates, repository participates | ExecutionService, TaskService |
| Locking Mechanism | SELECT FOR UPDATE + advisory locks + optimistic concurrency | Repository layer |
| Optimistic Concurrency | Version columns + compare-and-swap | Repository layer |
| State Transitions | Database constraints + atomic updates | Repository layer |
| Deduplication | Unique constraints + fingerprint validation | Repository layer |
| Retry Consistency | Atomic retry_count increment + state lock | ExecutionService, TaskService |
| Event Consistency | Transactional event writes + outbox pattern (deferred) | EventService |
| Failure Recovery | Transaction rollback + retry orchestration | Service layer |

---

## 2. Current Runtime Integrity Weaknesses

### 2.1 Transaction Boundary Gaps

**Current State:**
- No transaction boundaries in service operations
- Repository operations execute independently
- Event and log writes separate from state updates
- No rollback mechanism for partial failures

**Impact:**
- Partial state corruption possible
- Event/state desynchronization
- Log/state inconsistency
- No atomic multi-operation guarantees

**Evidence:**
- `ExecutionService.startExecution()` (lines 86-128) - no transaction
- `TaskService.startTask()` (lines 123-140) - no transaction
- Event publishing after state updates (not atomic)

### 2.2 Locking Gaps

**Current State:**
- No SELECT FOR UPDATE usage
- No advisory locks
- No row-level locking
- No distributed locking (deferred to future)

**Impact:**
- Race conditions on concurrent operations
- Duplicate execution possible
- Retry race conditions
- Lost update patterns

**Evidence:**
- No `FOR UPDATE` found in any repository
- No advisory lock usage
- Simple SELECT/UPDATE patterns

### 2.3 Optimistic Concurrency Gaps

**Current State:**
- No version columns
- No compare-and-swap operations
- No stale update detection
- No conflict resolution

**Impact:**
- Lost updates possible
- Concurrent state corruption
- No conflict visibility

**Evidence:**
- No version columns in tables
- No optimistic locking patterns

### 2.4 Deduplication Gaps

**Current State:**
- Application-level deduplication only
- No database unique constraints
- Race condition in check-and-create
- No atomic deduplication

**Impact:**
- Duplicate executions possible
- Duplicate provider calls
- Duplicate artifacts

**Evidence:**
- `ExecutionDeduplication.checkDuplicate()` - application-level only
- No unique constraints on fingerprint fields

### 2.5 Retry Consistency Gaps

**Current State:**
- Non-atomic retry_count check and increment
- No lock on execution during retry
- Concurrent retry possible
- Exceeded retry limit possible

**Impact:**
- Duplicate retry execution
- Resource exhaustion
- Retry limit violation

**Evidence:**
- `ExecutionService.retryExecution()` - non-atomic check-and-increment
- `TaskService.retryTask()` - same pattern

---

## 3. Canonical Transaction Ownership Model

### 3.1 Transaction Ownership Decision

**Canonical Decision:** Service layer owns transaction boundaries.

**Rationale:**
- Service layer owns business logic and state transition orchestration
- Service layer knows operation scope (execution start = state + event + log)
- Repository layer must remain pure data access
- Orchestrators coordinate but should not own transactions
- Centralized ownership prevents fragmentation

**Transaction Ownership Hierarchy:**

```
RuntimeService (Facade)
  ↓
ExecutionService (Transaction Owner)
  ↓
ExecutionRepository (Transaction Participant)
  ↓
Database Transaction
```

### 3.2 Transaction Scope Rules

**Rule 1: Service Layer Initiates Transactions**
- ExecutionService initiates transactions for execution lifecycle operations
- TaskService initiates transactions for task lifecycle operations
- EventService participates in service-layer transactions
- LogService participates in service-layer transactions

**Rule 2: Repository Layer Never Initiates Transactions**
- Repository methods accept optional transaction context
- Repository methods participate in existing transactions
- Repository methods never call BEGIN/COMMIT/ROLLBACK
- Repository layer remains pure data access

**Rule 3: Orchestrators Do Not Own Transactions**
- ExecutionOrchestrator coordinates but does not initiate transactions
- TaskOrchestrator coordinates but does not initiate transactions
- Orchestrators delegate to service layer for transactional operations

### 3.3 Transaction Boundary Definitions

**Execution Lifecycle Transactions:**

| Operation | Transaction Scope | Participants |
|-----------|------------------|---------------|
| createExecution | Insert execution + publish event + write log | ExecutionService, EventService, LogService |
| startExecution | Update execution status + publish event + write log | ExecutionService, EventService, LogService |
| completeExecution | Update execution status + publish event + write log | ExecutionService, EventService, LogService |
| failExecution | Update execution status + publish event + write log | ExecutionService, EventService, LogService |
| cancelExecution | Update execution status + publish event + write log | ExecutionService, EventService, LogService |
| retryExecution | Increment retry_count + update status + publish event + write log | ExecutionService, EventService, LogService |

**Task Lifecycle Transactions:**

| Operation | Transaction Scope | Participants |
|-----------|------------------|---------------|
| createTask | Insert task + publish event + write log | TaskService, EventService, LogService |
| startTask | Update task status + publish event + write log | TaskService, EventService, LogService |
| completeTask | Update task status + publish event + write log | TaskService, EventService, LogService |
| failTask | Update task status + publish event + write log | TaskService, EventService, LogService |
| retryTask | Increment retry_count + update status + publish event + write log | TaskService, EventService, LogService |

### 3.4 Nested Transaction Behavior

**Canonical Decision:** Use savepoints for nested operations, not true nested transactions.

**Rationale:**
- PostgreSQL does not support true nested transactions
- Savepoints provide partial rollback capability
- Simpler than autonomous transactions
- Preserves transaction integrity

**Savepoint Strategy:**
- Service layer creates savepoints before risky operations
- Rollback to savepoint on partial failure
- Continue transaction on savepoint rollback
- Full transaction rollback on unrecoverable failure

### 3.5 Transaction Propagation Rules

**Rule 1: Transaction Context Propagation**
- Service layer passes transaction context to repository methods
- Repository methods use provided transaction context if available
- Repository methods create new connection if no transaction context provided

**Rule 2: Read-Only Operations**
- Read-only operations do not require transactions
- Read-only operations use READ COMMITTED isolation
- Read-only operations do not participate in write transactions

**Rule 3: Write Operations**
- All write operations must participate in transactions
- Write operations inherit transaction context from service layer
- Write operations fail if no transaction context provided

### 3.6 Transaction Rollback Rules

**Rule 1: Automatic Rollback on Error**
- Service layer automatically rolls back on unrecoverable errors
- Repository layer throws errors, does not roll back
- Event and log writes rollback with transaction

**Rule 2: Partial Rollback on Recoverable Errors**
- Service layer uses savepoints for partial rollback
- Recoverable errors: task creation failure, event publish failure
- Unrecoverable errors: database constraint violation, connection failure

**Rule 3: Explicit Rollback on Validation Failure**
- Service layer rolls back on state transition validation failure
- Validation happens before state mutation
- Rollback prevents partial state corruption

### 3.7 Transaction Timeout Rules

**Canonical Decision:** 30-second transaction timeout for all operations.

**Rationale:**
- Prevents long-running transactions from blocking
- Sufficient for single-node operations
- Timeout configured at connection level
- Timeout exception triggers rollback

**Timeout Configuration:**
- Default: 30 seconds
- Long-running operations: 60 seconds (batch operations)
- Configurable per operation type

---

## 4. Canonical Locking Model

### 4.1 Locking Mechanism Decision

**Canonical Decision:** Multi-layer locking strategy.

**Layer 1: Pessimistic Locking (SELECT FOR UPDATE)**
- Used for critical state mutations
- Used for retry operations
- Used for dependency coordination

**Layer 2: Advisory Locks**
- Used for cross-transaction coordination
- Used for deduplication coordination
- Used for retry coordination

**Layer 3: Optimistic Locking (Version Columns)**
- Used for all state updates
- Used for conflict detection
- Used for lost update prevention

### 4.2 Locking Requirements by Operation

**Critical Operations Requiring Locking:**

| Operation | Lock Type | Lock Scope | Rationale |
|-----------|-----------|------------|-----------|
| execution start | SELECT FOR UPDATE | execution row | Prevents concurrent start |
| execution retry | SELECT FOR UPDATE + advisory lock | execution row + retry key | Prevents concurrent retry |
| task start | SELECT FOR UPDATE | task row | Prevents concurrent start |
| task retry | SELECT FOR UPDATE + advisory lock | task row + retry key | Prevents concurrent retry |
| dependency mutation | SELECT FOR UPDATE | dependent task rows | Prevents dependency race |
| publish operation | advisory lock | (tenant_id, content_id, cms_target) | Prevents duplicate publish |

**Non-Critical Operations (No Locking Required):**

| Operation | No Locking Required | Rationale |
|-----------|---------------------|-----------|
| execution read | Read-only, no mutation | No race condition |
| task read | Read-only, no mutation | No race condition |
| event publish | Optimistic concurrency sufficient | Event ordering not critical |
| log write | Append-only, no mutation | No race condition |

### 4.3 SELECT FOR UPDATE Strategy

**Canonical Decision:** Use SELECT FOR UPDATE for critical state mutations.

**Usage Rules:**

**Rule 1: Lock Before Validation**
- Acquire lock before state transition validation
- Validate while holding lock
- Update state while holding lock
- Release lock on transaction commit

**Rule 2: Lock Scope Minimization**
- Lock only the row being mutated
- Do not lock entire tables
- Release lock as soon as possible (transaction commit)

**Rule 3: Lock Timeout**
- 5-second lock acquisition timeout
- Fail fast if lock cannot be acquired
- Return conflict error to caller

### 4.4 Advisory Lock Strategy

**Canonical Decision:** Use PostgreSQL advisory locks for cross-transaction coordination.

**Usage Rules:**

**Rule 1: Advisory Lock Keys**
- Execution retry lock: `pg_try_advisory_xact_lock(hash(execution_id))`
- Task retry lock: `pg_try_advisory_xact_lock(hash(task_id))`
- Deduplication lock: `pg_try_advisory_xact_lock(hash(fingerprint))`
- Publish lock: `pg_try_advisory_xact_lock(hash(tenant_id, content_id, cms_target))`

**Rule 2: Advisory Lock Scope**
- Transaction-scoped advisory locks (xact_lock)
- Released automatically on transaction commit/rollback
- No manual release required

**Rule 3: Advisory Lock Timeout**
- Immediate failure if lock cannot be acquired
- No wait for advisory lock acquisition
- Return conflict error to caller

### 4.5 Optimistic Locking Strategy

**Canonical Decision:** Use version columns for all state updates.

**Usage Rules:**

**Rule 1: Version Column Requirements**
- All runtime tables require `version` column (BIGINT, default 0)
- Version increments on every update
- Version checked on update (WHERE version = expected_version)

**Rule 2: Compare-and-Swap Pattern**
- Read current version before update
- Update with WHERE version = expected_version
- Check affected rows (must be 1)
- Fail if affected rows = 0 (conflict)

**Rule 3: Conflict Resolution**
- Return conflict error to caller
- Caller decides retry strategy
- No automatic retry on conflict

### 4.6 Lock Acquisition Order

**Canonical Decision:** Fixed lock acquisition order to prevent deadlocks.

**Lock Order Hierarchy:**

1. Advisory locks (cross-transaction coordination)
2. Execution row locks (SELECT FOR UPDATE)
3. Task row locks (SELECT FOR UPDATE)

**Rationale:**
- Advisory locks acquired first (lightweight)
- Execution locks before task locks (parent before child)
- Consistent order prevents circular wait

### 4.7 Lock Timeout Policies

**Canonical Decision:** 5-second timeout for all lock acquisitions.

**Timeout Configuration:**

| Lock Type | Timeout | Behavior |
|-----------|---------|----------|
| SELECT FOR UPDATE | 5 seconds | Fail fast, return conflict error |
| Advisory Lock | Immediate | No wait, return conflict error |
| Optimistic Lock | N/A | Conflict detected on update |

### 4.8 Lock Release Guarantees

**Canonical Decision:** Locks released only on transaction commit/rollback.

**Release Rules:**

**Rule 1: Automatic Release**
- SELECT FOR UPDATE locks released on COMMIT/ROLLBACK
- Advisory locks released on COMMIT/ROLLBACK (xact_lock)
- No manual release required

**Rule 2: No Early Release**
- Do not release locks before transaction commit
- Do not release locks in savepoint rollback
- Locks held until transaction completes

---

## 5. Canonical Optimistic Concurrency Model

### 5.1 Version Column Strategy

**Canonical Decision:** All runtime tables require version columns.

**Version Column Specification:**

| Table | Version Column | Type | Default | Increment |
|-------|----------------|------|---------|-----------|
| agent_executions | version | BIGINT | 0 | +1 on update |
| agent_tasks | version | BIGINT | 0 | +1 on update |
| runtime_events | version | BIGINT | 0 | +1 on update |
| runtime_logs | version | BIGINT | 0 | +1 on update |

### 5.2 Compare-and-Swap Strategy

**Canonical Decision:** WHERE version = expected_version pattern.

**Implementation Pattern:**

```typescript
UPDATE table
SET status = $1, version = version + 1, updated_at = NOW()
WHERE id = $2 AND version = $3
RETURNING id, version
```

### 5.3 Stale Update Prevention

**Canonical Decision:** Fail on version conflict, do not overwrite.

**Prevention Strategy:**

**Rule 1: Read-Modify-Write Pattern**
- Read current version
- Modify data
- Write with version check
- Fail if version changed

**Rule 2: No Blind Updates**
- Never update without version check
- Always increment version on update

### 5.4 Retry-on-Conflict Policy

**Canonical Decision:** No automatic retry on version conflict.

**Policy:**

**Rule 1: Fail Fast**
- Return conflict error immediately
- Do not automatically retry
- Let caller decide retry strategy

**Rule 2: Caller-Controlled Retry**
- Service layer may retry with exponential backoff
- Retry limited to 3 attempts
- After 3 attempts, return permanent error

### 5.5 Conflict Detection Strategy

**Canonical Decision:** Database-level conflict detection via WHERE clause.

**Detection Mechanism:**

**Method 1: WHERE version = expected_version**
- Detects conflict on update
- Returns affected rows count
- Zero affected rows = conflict

### 5.6 Versioning Scope

**Canonical Decision:** All runtime entities require versioning.

**Required Versioning:**
- ✅ agent_executions (execution state)
- ✅ agent_tasks (task state)
- ✅ runtime_events (event state)
- ✅ runtime_logs (log state)

### 5.7 Migration Strategy

**Canonical Decision:** Add version columns via non-blocking migration.

**Migration Steps:**

**Step 1: Add Version Columns**
```sql
ALTER TABLE agent_executions ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE agent_tasks ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE runtime_events ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE runtime_logs ADD COLUMN version BIGINT DEFAULT 0;
```

**Step 2: Backfill Version Values**
```sql
UPDATE agent_executions SET version = 0 WHERE version IS NULL;
UPDATE agent_tasks SET version = 0 WHERE version IS NULL;
UPDATE runtime_events SET version = 0 WHERE version IS NULL;
UPDATE runtime_logs SET version = 0 WHERE version IS NULL;
```

**Step 3: Add NOT NULL Constraint**
```sql
ALTER TABLE agent_executions ALTER COLUMN version SET NOT NULL;
ALTER TABLE agent_tasks ALTER COLUMN version SET NOT NULL;
ALTER TABLE runtime_events ALTER COLUMN version SET NOT NULL;
ALTER TABLE runtime_logs ALTER COLUMN version SET NOT NULL;
```

---

## 6. Canonical Atomic State Transition Model

### 6.1 State Transition Atomicity Decision

**Canonical Decision:** Database constraints + atomic updates for state transitions.

**Rationale:**
- Database constraints enforce state machine
- Atomic updates prevent intermediate states
- No invalid state transitions possible
- State machine integrity guaranteed at database layer

### 6.2 Execution State Transition Strategy

**Canonical Decision:** Check constraint for valid state transitions.

**State Machine:**

```
PENDING → RUNNING → COMPLETED
   ↓         ↓
 CANCELLED  FAILED
   ↓         ↓
         RETRYING → RUNNING
```

**Database Constraint:**

```sql
ALTER TABLE agent_executions
ADD CONSTRAINT execution_state_transition_check
CHECK (
  (status = 'PENDING' AND new_status IN ('RUNNING', 'CANCELLED')) OR
  (status = 'RUNNING' AND new_status IN ('COMPLETED', 'FAILED', 'CANCELLED')) OR
  (status = 'FAILED' AND new_status IN ('RETRYING', 'CANCELLED')) OR
  (status = 'RETRYING' AND new_status = 'RUNNING') OR
  (status = 'CANCELLED' AND new_status = 'CANCELLED') OR
  (status = 'COMPLETED' AND new_status = 'COMPLETED')
);
```

### 6.3 Task State Transition Strategy

**Canonical Decision:** Check constraint for valid task state transitions.

**State Machine:**

```
PENDING → RUNNING → COMPLETED
   ↓         ↓
 SKIPPED   FAILED
   ↓         ↓
         RETRYING → RUNNING
```

### 6.4 Retry State Transition Strategy

**Canonical Decision:** Atomic retry_count increment + state transition.

**Implementation Pattern:**

```typescript
BEGIN TRANSACTION
  SELECT pg_try_advisory_xact_lock(hash($1)) AS lock_acquired
  IF NOT lock_acquired:
    ROLLBACK
    RETURN error('retry_in_progress')
  
  SELECT * FROM agent_executions WHERE id = $1 FOR UPDATE
  
  UPDATE agent_executions
  SET retry_count = retry_count + 1, status = 'RETRYING', version = version + 1
  WHERE id = $1 AND status = 'FAILED' AND retry_count < maxRetries AND version = $2
  
  UPDATE agent_executions
  SET status = 'RUNNING', started_at = NOW(), version = version + 1
  WHERE id = $1 AND status = 'RETRYING'
COMMIT
```

### 6.5 Dependency Coordination Strategy

**Canonical Decision:** Dependency check + task start in single transaction.

### 6.6 Validation + Mutation Strategy

**Canonical Decision:** Validation in WHERE clause, not separate check.

**Canonical Pattern (Safe):**
```typescript
const result = await repository.updateStatus(
  id, 'RUNNING',
  { where: { status: 'PENDING', version: expectedVersion } }
);
if (result.affectedRows === 0) {
  return error('invalid_state_or_version_conflict');
}
```

### 6.7 State Machine Enforcement Strategy

**Canonical Decision:** Database constraints + service validation.

**Enforcement Layers:**

**Layer 1: Database Constraints (Hard Enforcement)**
- CHECK constraints for valid transitions
- Prevents invalid transitions at database level

**Layer 2: Service Validation (Soft Enforcement)**
- Service layer validates before mutation
- Provides better error messages

### 6.8 Invalid Transition Handling

**Canonical Decision:** Return specific error, do not auto-correct.

**Error Type:** `InvalidStateTransitionError`

### 6.9 Concurrent Mutation Handling

**Canonical Decision:** First writer wins, second writer gets conflict error.

---

## 7. Canonical Deduplication Model

### 7.1 Deduplication Authority Decision

**Canonical Decision:** Database unique constraints are authoritative.

**Rationale:**
- Database constraints cannot be bypassed
- Atomic deduplication (no race conditions)
- Single source of truth

### 7.2 Database Uniqueness Strategy

**Canonical Decision:** Unique constraints on fingerprint fields.

**Unique Constraints:**

**Execution Deduplication:**
```sql
ALTER TABLE agent_executions
ADD CONSTRAINT execution_fingerprint_unique
UNIQUE (tenant_id, agent_name, workflow_type, input_hash);
```

**Task Deduplication:**
```sql
ALTER TABLE agent_tasks
ADD CONSTRAINT task_fingerprint_unique
UNIQUE (execution_id, task_name, task_type, input_hash);
```

**Publish Deduplication:**
```sql
ALTER TABLE publish_attempts
ADD CONSTRAINT publish_fingerprint_unique
UNIQUE (tenant_id, content_id, cms_target);
```

### 7.3 Fingerprint Strategy

**Canonical Decision:** SHA-256 hash of key fields.

**Fingerprint Definition:**

**Execution Fingerprint:**
```typescript
fingerprint = SHA256(
  tenant_id + ":" + agent_name + ":" + workflow_type + ":" +
  JSON.stringify(input_payload, sorted_keys)
)
```

### 7.4 Replay Protection Strategy

**Canonical Decision:** Unique constraint + replay window.

**Replay Window:**
- 24-hour replay window for executions
- 1-hour replay window for tasks

**Implementation:**

**Option 2: Partial Index (PostgreSQL All Versions)**
```sql
CREATE UNIQUE INDEX execution_replay_unique
ON agent_executions (tenant_id, agent_name, workflow_type, input_hash)
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### 7.5 Duplicate Publish Prevention

**Canonical Decision:** Unique constraint + application check.

### 7.6 Retry Duplication Prevention

**Canonical Decision:** Advisory lock + retry_count increment.

### 7.7 Authoritative Deduplication Layer

**Canonical Decision:** Database layer is authoritative.

**Authority Hierarchy:**

**Layer 1: Database Constraints (Authoritative)**
- Unique constraints enforce deduplication
- Cannot be bypassed

**Layer 2: Repository Layer (Enforcement)**
- Repository checks constraints
- Returns constraint violation errors

**Layer 3: Service Layer (Optimization)**
- Service layer checks before mutation
- Optimization, not authority

### 7.8 Fallback Behavior

**Canonical Decision:** Return specific duplicate error, do not auto-retry.

### 7.9 Duplicate Recovery Behavior

**Canonical Decision:** Return existing execution, do not create new.

---

## 8. Canonical Retry Consistency Model

### 8.1 Retry Atomicity Decision

**Canonical Decision:** Atomic retry_count increment + state transition.

### 8.2 Retry Ownership Decision

**Canonical Decision:** Service layer owns retry logic.

**Ownership:**

**Execution Retry:**
- Owner: ExecutionService
- Method: `retryExecution(executionId)`
- Transaction: Service-owned
- Locking: Advisory lock + row lock

**Task Retry:**
- Owner: TaskService
- Method: `retryTask(taskId)`
- Transaction: Service-owned
- Locking: Advisory lock + row lock

**Connector Retry:**
- Owner: Service layer (not connector)
- Connectors do not own retries

### 8.3 Retry Sequencing Decision

**Canonical Decision:** Sequential retry, no parallel retry.

**Sequencing Rules:**

**Rule 1: Single Retry at a Time**
- Only one retry operation per execution
- Advisory lock prevents concurrent retry

**Rule 2: Retry State Machine**
- FAILED → RETRYING → RUNNING
- Cannot skip RETRYING state

**Rule 3: Execution vs Task Retry Precedence**
- Execution retry takes precedence over task retry

### 8.4 Retry Locking Strategy

**Canonical Decision:** Advisory lock + row lock.

### 8.5 Retry Visibility Guarantees

**Canonical Decision:** Retry state visible immediately after commit.

### 8.6 Retry State Machine

**Canonical Decision:** FAILED → RETRYING → RUNNING state machine.

### 8.7 Retry Coordination Rules

**Canonical Decision:** Service layer coordinates retry, connectors do not.

**Coordination Rules:**

**Rule 1: Connector Returns Error**
- Connector detects failure
- Connector returns error to service
- Connector does not retry

**Rule 2: Service Decides Retry**
- Service receives connector error
- Service evaluates retry policy
- Service initiates retry if eligible

**Rule 3: Retry Policy**
- Max retries: 3 (configurable)
- Retry delay: exponential backoff
- Retryable errors: network timeout, rate limit, transient errors

### 8.8 Execution vs Task Retry Precedence

**Canonical Decision:** Execution retry takes precedence.

---

## 9. Canonical Event Consistency Strategy

### 9.1 Event Consistency Model Decision

**Canonical Decision:** Transactional event writes (no outbox pattern initially).

**Rationale:**
- Single-node deployment (no distributed transactions)
- Simpler implementation
- Event/state synchronized in same transaction
- Outbox pattern deferred to multi-node phase

### 9.2 Transactional Event Strategy

**Canonical Decision:** Events written in same transaction as state.

**Implementation Pattern:**

```typescript
BEGIN TRANSACTION
  UPDATE agent_executions SET status = 'RUNNING', version = version + 1
  WHERE id = $1 AND status = 'PENDING' AND version = $2
  
  INSERT INTO runtime_events (...) VALUES (...)
  
  INSERT INTO runtime_logs (...) VALUES (...)
  
COMMIT
```

### 9.3 Event Ordering Guarantees

**Canonical Decision:** Event order matches state transition order.

**Ordering Rules:**

**Rule 1: Single Transaction = Single Event**
- One state transition = one event
- Event written immediately after state update

**Rule 2: Event Sequence**
- Events ordered by created_at timestamp
- Events ordered by transaction commit order

**Rule 3: Causality Preservation**
- Execution started event before task started events
- Parent events before child events

### 9.4 Outbox Requirements (Deferred)

**Canonical Decision:** Outbox pattern deferred to multi-node phase.

**Rationale:**
- Outbox pattern required for distributed systems
- Single-node deployment does not need outbox
- Simpler implementation without outbox

### 9.5 Event Rollback Behavior

**Canonical Decision:** Events rollback with transaction on failure.

**Rollback Rules:**

**Rule 1: Transaction Rollback**
- If state update fails, event not written
- If event write fails, state update rolled back
- All or nothing semantics

**Rule 2: Partial Rollback**
- Use savepoints for partial rollback
- Event write failure = rollback to savepoint

### 9.6 Replay Handling

**Canonical Decision:** Events not replayed from event log.

**Replay Strategy:**

**Rule 1: Source of Truth is State**
- Execution state is source of truth
- Events are derived from state

**Rule 2: Event Idempotency**
- Event publishing is idempotent
- Duplicate events rejected

### 9.7 Failure Recovery Strategy

**Canonical Decision:** Transaction rollback + retry on transient failure.

**Recovery Strategy:**

**Rule 1: Transient Failure**
- Event publish failure (network timeout)
- Transaction rollback
- Retry with exponential backoff

**Rule 2: Permanent Failure**
- Event publish failure (validation error)
- Transaction rollback
- Return error to caller

---

## 10. Database Constraint & Index Strategy

### 10.1 Required Unique Constraints

**Execution Deduplication:**
```sql
ALTER TABLE agent_executions
ADD CONSTRAINT execution_fingerprint_unique
UNIQUE (tenant_id, agent_name, workflow_type, input_hash);
```

**Task Deduplication:**
```sql
ALTER TABLE agent_tasks
ADD CONSTRAINT task_fingerprint_unique
UNIQUE (execution_id, task_name, task_type, input_hash);
```

**Publish Deduplication:**
```sql
ALTER TABLE publish_attempts
ADD CONSTRAINT publish_fingerprint_unique
UNIQUE (tenant_id, content_id, cms_target);
```

### 10.2 Required State Transition Constraints

**Execution State Transition:**
```sql
ALTER TABLE agent_executions
ADD CONSTRAINT execution_state_transition_check
CHECK (
  (status = 'PENDING' AND new_status IN ('RUNNING', 'CANCELLED')) OR
  (status = 'RUNNING' AND new_status IN ('COMPLETED', 'FAILED', 'CANCELLED')) OR
  (status = 'FAILED' AND new_status IN ('RETRYING', 'CANCELLED')) OR
  (status = 'RETRYING' AND new_status = 'RUNNING') OR
  (status = 'CANCELLED' AND new_status = 'CANCELLED') OR
  (status = 'COMPLETED' AND new_status = 'COMPLETED')
);
```

**Task State Transition:**
```sql
ALTER TABLE agent_tasks
ADD CONSTRAINT task_state_transition_check
CHECK (
  (status = 'PENDING' AND new_status IN ('RUNNING', 'SKIPPED')) OR
  (status = 'RUNNING' AND new_status IN ('COMPLETED', 'FAILED', 'SKIPPED')) OR
  (status = 'FAILED' AND new_status IN ('RETRYING', 'SKIPPED')) OR
  (status = 'RETRYING' AND new_status = 'RUNNING') OR
  (status = 'SKIPPED' AND new_status = 'SKIPPED') OR
  (status = 'COMPLETED' AND new_status = 'COMPLETED')
);
```

### 10.3 Required Indexes

**Execution Indexes:**
```sql
CREATE INDEX idx_executions_tenant_status
ON agent_executions (tenant_id, status);

CREATE INDEX idx_executions_fingerprint
ON agent_executions (fingerprint);

CREATE INDEX idx_executions_created_at
ON agent_executions (created_at);

CREATE INDEX idx_executions_execution_tasks
ON agent_tasks (execution_id);
```

**Task Indexes:**
```sql
CREATE INDEX idx_tasks_execution_status
ON agent_tasks (execution_id, status);

CREATE INDEX idx_tasks_fingerprint
ON agent_tasks (fingerprint);

CREATE INDEX idx_tasks_name
ON agent_tasks (task_name);
```

**Event Indexes:**
```sql
CREATE INDEX idx_events_execution
ON runtime_events (execution_id);

CREATE INDEX idx_events_tenant
ON runtime_events (tenant_id);

CREATE INDEX idx_events_name
ON runtime_events (event_name);

CREATE INDEX idx_events_created_at
ON runtime_events (created_at);
```

**Log Indexes:**
```sql
CREATE INDEX idx_logs_execution
ON runtime_logs (execution_id);

CREATE INDEX idx_logs_task
ON runtime_logs (task_id);

CREATE INDEX idx_logs_severity
ON runtime_logs (log_level);
```

### 10.4 Version Column Constraints

```sql
ALTER TABLE agent_executions ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE agent_tasks ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE runtime_events ADD COLUMN version BIGINT DEFAULT 0;
ALTER TABLE runtime_logs ADD COLUMN version BIGINT DEFAULT 0;

ALTER TABLE agent_executions ALTER COLUMN version SET NOT NULL;
ALTER TABLE agent_tasks ALTER COLUMN version SET NOT NULL;
ALTER TABLE runtime_events ALTER COLUMN version SET NOT NULL;
ALTER TABLE runtime_logs ALTER COLUMN version SET NOT NULL;

ALTER TABLE agent_executions
ADD CONSTRAINT version_non_negative CHECK (version >= 0);
ALTER TABLE agent_tasks
ADD CONSTRAINT version_non_negative CHECK (version >= 0);
ALTER TABLE runtime_events
ADD CONSTRAINT version_non_negative CHECK (version >= 0);
ALTER TABLE runtime_logs
ADD CONSTRAINT version_non_negative CHECK (version >= 0);
```

### 10.5 Fingerprint Column Constraints

```sql
ALTER TABLE agent_executions ADD COLUMN fingerprint TEXT;
ALTER TABLE agent_tasks ADD COLUMN fingerprint TEXT;
ALTER TABLE publish_attempts ADD COLUMN fingerprint TEXT;
```

---

## 11. Deadlock Prevention Strategy

### 11.1 Lock Acquisition Order

**Canonical Decision:** Fixed lock acquisition order.

**Lock Order:**

1. Advisory locks (lightweight, cross-transaction)
2. Execution row locks (parent entities)
3. Task row locks (child entities)

### 11.2 Lock Timeout Strategy

**Canonical Decision:** 5-second timeout for all lock acquisitions.

**Timeout Configuration:**

| Lock Type | Timeout | Behavior |
|-----------|---------|----------|
| SELECT FOR UPDATE | 5 seconds | SET lock_timeout = '5s' |
| Advisory Lock | Immediate | pg_try_advisory_xact_lock (no wait) |
| Optimistic Lock | N/A | Conflict detected on update |

### 11.3 Lock Scope Minimization

**Canonical Decision:** Lock only required rows.

**Scope Rules:**

**Rule 1: Row-Level Locking**
- Lock only the row being mutated
- Do not lock entire tables

**Rule 2: Minimal Lock Duration**
- Acquire lock immediately before mutation
- Release lock on transaction commit

**Rule 3: No Lock Chaining**
- Do not acquire lock while holding another lock
- Acquire all locks before any mutation

### 11.4 Deadlock Detection

**Canonical Decision:** Database deadlock detection + application logging.

### 11.5 Retry Strategy

**Canonical Decision:** Retry deadlock with exponential backoff.

**Retry Configuration:**

**Retry Rules:**
- Max retries: 3
- Backoff: exponential (1s, 2s, 4s)
- Jitter: random ±20%
- After 3 retries: return permanent error

---

## 12. Transaction Isolation Strategy

### 12.1 Isolation Level Decision

**Canonical Decision:** READ COMMITTED isolation level.

**Rationale:**
- PostgreSQL default isolation level
- Prevents dirty reads
- Allows non-repeatable reads (acceptable for runtime)
- Better performance than SERIALIZABLE
- Sufficient for single-node deployment

### 12.2 Isolation Level Configuration

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### 12.3 Read-Only Transactions

```sql
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED READ ONLY;
```

### 12.4 Transaction Duration

**Canonical Decision:** Minimize transaction duration.

**Duration Rules:**

**Rule 1: Short Transactions**
- Transactions should complete in < 1 second
- Long-running operations split into multiple transactions

**Rule 2: No External Calls**
- Do not call external APIs within transactions

**Rule 3: Batch Operations**
- Batch operations in single transaction
- Limit batch size to 100 records

---

## 13. Failure Recovery Boundary Model

### 13.1 Transaction Rollback Scope

**Canonical Decision:** Rollback entire transaction on unrecoverable error.

**Rollback Rules:**

**Rule 1: Automatic Rollback**
- Database constraint violation → rollback
- Connection failure → rollback
- Deadlock → rollback

**Rule 2: Partial Rollback (Savepoints)**
- Task creation failure → rollback to savepoint
- Event publish failure → rollback to savepoint

**Rule 3: Explicit Rollback**
- Validation failure → explicit rollback

### 13.2 Retry Handling Scope

**Canonical Decision:** Retry at service layer, not repository layer.

### 13.3 Recovery Orchestration Scope

**Canonical Decision:** RecoveryOrchestrator handles recovery workflows.

### 13.4 Failure Classification

**Failure Classification:**

**Transient Failures (Retryable):**
- Network timeout
- Rate limit exceeded
- Connection failure
- Deadlock

**Permanent Failures (Non-Retryable):**
- Authentication failure
- Validation error
- Constraint violation

**Recoverable Failures (Manual Recovery):**
- Stalled execution
- Orphaned task

**Unrecoverable Failures (Data Loss):**
- Database corruption
- Data deletion

### 13.5 Partial Failure Handling

**Canonical Decision:** Use savepoints for partial failure handling.

### 13.6 Transaction Rollback Scope

**Canonical Decision:** Rollback entire transaction on unrecoverable error.

---

## 14. Incremental Migration Strategy

### 14.1 Migration Sequencing Principles

**Canonical Decision:** Incremental migration to minimize runtime destabilization.

**Migration Principles:**

**Principle 1: Non-Breaking Changes First**
- Add columns (non-breaking)
- Add indexes (non-breaking)
- Add constraints (defer validation)

**Principle 2: Backward Compatibility**
- New code works with old schema
- Old code works with new schema

**Principle 3: Feature Flags**
- New features behind feature flags
- Gradual feature enablement

**Principle 4: Monitoring**
- Monitor each migration step
- Rollback if issues detected

### 14.2 Migration Phase 1: Schema Foundation

**Phase 1.1: Add Version Columns**

**Steps:**
1. Add version columns (default 0, nullable)
2. Backfill version values
3. Add NOT NULL constraint
4. Deploy repository layer changes
5. Deploy service layer changes

**Risk:** LOW
**Duration:** 1 week

**Phase 1.2: Add Fingerprint Columns**

**Steps:**
1. Add fingerprint columns (nullable)
2. Deploy deduplication logic (application-level)
3. Backfill fingerprint values
4. Add unique constraints
5. Deploy constraint-aware code

**Risk:** MEDIUM
**Duration:** 2 weeks

**Phase 1.3: Add State Transition Constraints**

**Steps:**
1. Add state transition constraints (NOT VALID)
2. Validate constraints
3. Enable constraints (VALID)
4. Deploy constraint-aware code

**Risk:** MEDIUM
**Duration:** 2 weeks

### 14.3 Migration Phase 2: Transaction Boundaries

**Phase 2.1: Implement Transaction Context**

**Steps:**
1. Add transaction context to repository methods
2. Implement transaction context propagation
3. Deploy repository layer changes
4. Deploy service layer changes (no transactions yet)

**Risk:** LOW
**Duration:** 1 week

**Phase 2.2: Implement Service-Layer Transactions**

**Steps:**
1. Implement transaction initiation in ExecutionService
2. Implement transaction initiation in TaskService
3. Implement transaction initiation in EventService
4. Implement transaction initiation in LogService
5. Deploy service layer changes
6. Enable transactions with feature flag

**Risk:** MEDIUM
**Duration:** 2 weeks

**Phase 2.3: Implement Savepoints**

**Steps:**
1. Implement savepoint usage in ExecutionService
2. Implement savepoint usage in TaskService
3. Deploy service layer changes
4. Enable savepoints with feature flag

**Risk:** MEDIUM
**Duration:** 1 week

### 14.4 Migration Phase 3: Locking Implementation

**Phase 3.1: Implement SELECT FOR UPDATE**

**Steps:**
1. Implement SELECT FOR UPDATE in ExecutionRepository
2. Implement SELECT FOR UPDATE in TaskRepository
3. Implement lock timeout configuration
4. Deploy repository layer changes
5. Deploy service layer changes
6. Enable locking with feature flag

**Risk:** MEDIUM
**Duration:** 2 weeks

**Phase 3.2: Implement Advisory Locks**

**Steps:**
1. Implement advisory lock functions
2. Implement advisory lock usage in ExecutionService
3. Implement advisory lock usage in TaskService
4. Deploy service layer changes
5. Enable advisory locks with feature flag

**Risk:** MEDIUM
**Duration:** 2 weeks

**Phase 3.3: Implement Optimistic Locking**

**Steps:**
1. Implement version checking in repository updates
2. Implement conflict error handling
3. Deploy repository layer changes
4. Deploy service layer changes
5. Enable optimistic locking with feature flag

**Risk:** MEDIUM
**Duration:** 2 weeks

### 14.5 Migration Phase 4: Retry Consistency

**Phase 4.1: Implement Atomic Retry Count**

**Steps:**
1. Implement atomic retry_count increment
2. Implement retry advisory locks
3. Deploy service layer changes
4. Enable atomic retry with feature flag

**Risk:** MEDIUM
**Duration:** 1 week

**Phase 4.2: Implement Retry State Machine**

**Steps:**
1. Add retry state transition constraints
2. Implement retry state transitions
3. Deploy service layer changes
4. Enable retry state machine with feature flag

**Risk:** MEDIUM
**Duration:** 1 week

### 14.6 Migration Phase 5: Event Consistency

**Phase 5.1: Implement Transactional Events**

**Steps:**
1. Implement event writes in service transactions
2. Implement event rollback handling
3. Deploy service layer changes
4. Enable transactional events with feature flag

**Risk:** MEDIUM
**Duration:** 1 week

**Phase 5.2: Implement Event Ordering**

**Steps:**
1. Implement event sequence numbers
2. Implement event ordering logic
3. Deploy service layer changes
4. Enable event ordering with feature flag

**Risk:** LOW
**Duration:** 1 week

### 14.7 Migration Timeline

**Total Duration:** 13 weeks

| Phase | Duration | Risk | Dependencies |
|-------|----------|------|--------------|
| Phase 1: Schema Foundation | 5 weeks | LOW-MEDIUM | None |
| Phase 2: Transaction Boundaries | 4 weeks | MEDIUM | Phase 1 |
| Phase 3: Locking Implementation | 6 weeks | MEDIUM | Phase 2 |
| Phase 4: Retry Consistency | 2 weeks | MEDIUM | Phase 3 |
| Phase 5: Event Consistency | 2 weeks | LOW-MEDIUM | Phase 2 |

**Total:** 19 weeks (with dependencies)

### 14.8 Rollback Strategy

**Rollback Triggers:**
- High error rate (> 1%)
- Performance degradation (> 20%)
- Deadlock rate increase (> 0.1%)
- Data inconsistency detected

**Rollback Procedure:**
1. Disable feature flags
2. Revert last migration
3. Monitor for stability
4. Investigate root cause
5. Fix and retry migration

---

## 15. Architectural Risk Analysis

### 15.1 Transaction Complexity Risk

**Risk:** Increased transaction complexity may introduce bugs.

**Mitigation:**
- Comprehensive testing
- Gradual rollout with feature flags
- Monitoring for transaction failures
- Quick rollback capability

**Severity:** MEDIUM
**Likelihood:** MEDIUM
**Impact:** MEDIUM

### 15.2 Lock Contention Risk

**Risk:** Locking may cause contention and performance degradation.

**Mitigation:**
- Lock scope minimization
- Lock timeout configuration
- Monitoring for lock wait time
- Deadlock detection and retry

**Severity:** MEDIUM
**Likelihood:** MEDIUM
**Impact:** MEDIUM

### 15.3 Schema Migration Risk

**Risk:** Schema migrations may cause downtime or data loss.

**Mitigation:**
- Non-blocking migrations
- Backward compatibility
- Migration testing in staging
- Rollback procedures

**Severity:** LOW
**Likelihood:** LOW
**Impact:** HIGH

### 15.4 Version Conflict Risk

**Risk:** High version conflict rate may cause performance issues.

**Mitigation:**
- Optimistic locking with retry
- Conflict monitoring
- Retry with exponential backoff

**Severity:** LOW
**Likelihood:** LOW
**Impact:** MEDIUM

### 15.5 Deadlock Risk

**Risk:** Deadlocks may occur with increased locking.

**Mitigation:**
- Fixed lock acquisition order
- Lock timeout configuration
- Deadlock detection and retry
- Monitoring for deadlock rate

**Severity:** MEDIUM
**Likelihood:** MEDIUM
**Impact:** MEDIUM

### 15.6 Event Consistency Risk

**Risk:** Event publishing failures may cause transaction rollbacks.

**Mitigation:**
- Event service reliability
- Event publishing retry
- Circuit breaker pattern

**Severity:** LOW
**Likelihood:** LOW
**Impact:** MEDIUM

### 15.7 Retry Logic Risk

**Risk:** Retry logic may cause resource exhaustion.

**Mitigation:**
- Retry limit enforcement
- Retry backoff configuration
- Monitoring for retry rate
- Circuit breaker pattern

**Severity:** LOW
**Likelihood:** LOW
**Impact:** MEDIUM

### 15.8 Migration Rollback Risk

**Risk:** Migration rollback may be difficult or impossible.

**Mitigation:**
- Incremental migration
- Feature flags
- Rollback procedures
- Migration testing

**Severity:** LOW
**Likelihood:** LOW
**Impact:** HIGH

---

## 16. Final Recommended Runtime Concurrency Law

### 16.1 Canonical Transaction Law

**Law 1: Service Layer Owns Transactions**
- ExecutionService, TaskService, EventService, LogService own transaction boundaries
- Repository layer participates in transactions but does not initiate
- Orchestrators coordinate but do not own transactions
- No transaction ownership fragmentation

**Law 2: Transaction Scope = Operation Scope**
- Execution lifecycle operations: state + event + log in single transaction
- Task lifecycle operations: state + event + log in single transaction
- All or nothing semantics
- No partial state persistence

**Law 3: Transaction Timeout = 30 Seconds**
- All transactions timeout after 30 seconds
- Long-running operations split into multiple transactions
- Fail fast on timeout

### 16.2 Canonical Locking Law

**Law 1: Multi-Layer Locking**
- Layer 1: SELECT FOR UPDATE for critical state mutations
- Layer 2: Advisory locks for cross-transaction coordination
- Layer 3: Optimistic locking for all state updates

**Law 2: Lock Acquisition Order**
- Advisory locks first
- Execution row locks second
- Task row locks third
- Consistent order prevents deadlocks

**Law 3: Lock Timeout = 5 Seconds**
- All lock acquisitions timeout after 5 seconds
- Fail fast on lock timeout
- Return conflict error to caller

### 16.3 Canonical Optimistic Concurrency Law

**Law 1: All Runtime Entities Require Versioning**
- agent_executions, agent_tasks, runtime_events, runtime_logs require version columns
- Version increments on every update
- Version checked on update (WHERE version = expected_version)

**Law 2: Compare-and-Swap Pattern**
- Read current version before update
- Update with WHERE version = expected_version
- Fail if version changed (conflict)

**Law 3: No Automatic Retry on Conflict**
- Return conflict error immediately
- Caller decides retry strategy
- Service layer may retry with exponential backoff

### 16.4 Canonical State Transition Law

**Law 1: Database Constraints Enforce State Machine**
- CHECK constraints for valid state transitions
- Invalid transitions rejected at database level
- State machine integrity guaranteed

**Law 2: Validation + Mutation in Single Operation**
- Validation in WHERE clause, not separate check
- Atomic state transition
- No race conditions

**Law 3: Invalid Transition = Error**
- Return specific error on invalid transition
- Do not auto-correct invalid transitions
- Caller handles error

### 16.5 Canonical Deduplication Law

**Law 1: Database Unique Constraints Are Authoritative**
- Unique constraints on fingerprint fields
- Database constraints cannot be bypassed
- Application-level check is optimization, not authority

**Law 2: Fingerprint = SHA-256 Hash**
- SHA-256 hash of key fields
- Sorted keys for consistent hashing
- Fingerprint stored in database

**Law 3: Duplicate = Error**
- Return specific duplicate error
- Do not auto-retry on duplicate
- Caller decides recovery strategy

### 16.6 Canonical Retry Law

**Law 1: Service Layer Owns Retries**
- ExecutionService owns execution retries
- TaskService owns task retries
- Connectors do not own retries
- No retry ownership fragmentation

**Law 2: Retry = Advisory Lock + Atomic Increment**
- Acquire advisory lock before retry
- Atomic retry_count increment
- State transition in same transaction
- Lock released on commit

**Law 3: Retry Limit = 3**
- Max 3 retries per execution/task
- Exponential backoff (1s, 2s, 4s)
- After 3 retries: permanent error

### 16.7 Canonical Event Law

**Law 1: Events in Same Transaction as State**
- Event written in same transaction as state update
- Event rollback with state on failure
- Event/state synchronized

**Law 2: Event Order = State Transition Order**
- Events ordered by created_at timestamp
- Parent events before child events
- Causality preserved

**Law 3: Event Failure = Transaction Rollback**
- Event publish failure triggers rollback
- State not updated if event cannot be published
- Caller receives event publish error

### 16.8 Canonical Failure Recovery Law

**Law 1: Transient Failure = Retry**
- Network timeout, rate limit, connection failure
- Retry with exponential backoff
- Max 3 retries

**Law 2: Permanent Failure = Error**
- Authentication, validation, constraint violation
- No automatic retry
- Return error to caller

**Law 3: Recoverable Failure = Manual Recovery**
- Stalled execution, orphaned task
- RecoveryOrchestrator handles
- Manual intervention may be required

---

## 17. Final Certification Readiness Assessment

### 17.1 Pre-Implementation Certification

**Current Status:** ❌ **NOT CERTIFIED**

**Certification Criteria:**
- ❌ Transaction boundaries defined
- ❌ Locking strategy defined
- ❌ Optimistic concurrency defined
- ❌ State transition strategy defined
- ❌ Deduplication strategy defined
- ❌ Retry consistency defined
- ❌ Event consistency defined
- ❌ Migration sequencing defined

**Certification Status:** ⚠️ **ARCHITECTURE DEFINED, AWAITING IMPLEMENTATION**

### 17.2 Post-Implementation Certification (Projected)

**After Phase 1 (Schema Foundation):**
- ✅ Version columns added
- ✅ Fingerprint columns added
- ✅ State transition constraints added
- ⚠️ Transaction boundaries not yet implemented
- ⚠️ Locking not yet implemented

**Certification Status:** ⚠️ **PARTIALLY CERTIFIED (SCHEMA ONLY)**

**After Phase 2 (Transaction Boundaries):**
- ✅ Transaction boundaries implemented
- ✅ Savepoints implemented
- ⚠️ Locking not yet implemented
- ⚠️ Optimistic concurrency not yet implemented

**Certification Status:** ⚠️ **PARTIALLY CERTIFIED (TRANSACTIONS ONLY)**

**After Phase 3 (Locking Implementation):**
- ✅ SELECT FOR UPDATE implemented
- ✅ Advisory locks implemented
- ✅ Optimistic locking implemented
- ⚠️ Retry consistency not yet implemented

**Certification Status:** ⚠️ **PARTIALLY CERTIFIED (LOCKING ONLY)**

**After Phase 4 (Retry Consistency):**
- ✅ Atomic retry count implemented
- ✅ Retry state machine implemented
- ⚠️ Event consistency not yet implemented

**Certification Status:** ⚠️ **PARTIALLY CERTIFIED (RETRY ONLY)**

**After Phase 5 (Event Consistency):**
- ✅ Transactional events implemented
- ✅ Event ordering implemented
- ✅ All phases complete

**Certification Status:** ✅ **FULLY CERTIFIED (SINGLE-NODE)**

### 17.3 Final Certification Projection

**Projected Timeline:** 19 weeks

**Certification Milestones:**

| Milestone | Timeline | Certification Status |
|-----------|----------|---------------------|
| Architecture Plan Complete | Week 0 | ✅ Architecture Defined |
| Schema Foundation Complete | Week 5 | ⚠️ Schema Certified |
| Transaction Boundaries Complete | Week 9 | ⚠️ Transactions Certified |
| Locking Implementation Complete | Week 15 | ⚠️ Locking Certified |
| Retry Consistency Complete | Week 17 | ⚠️ Retry Certified |
| Event Consistency Complete | Week 19 | ✅ Fully Certified |

### 17.4 Production Readiness Projection

**Single-Node Production Readiness:** ✅ **READY AFTER PHASE 5**

**Multi-Node Production Readiness:** ❌ **NOT READY (FUTURE PHASE)**

**Future Multi-Node Requirements:**
- Distributed locking implementation
- Execution lease enforcement
- Heartbeat mechanism
- Automatic stall detection
- Outbox pattern for events
- Distributed state synchronization

**Projected Multi-Node Timeline:** 12-16 additional weeks

---

## 18. Conclusion

This architecture plan defines the canonical concurrency model for the CLAUX runtime stack, addressing all critical gaps identified in TASK 5B.1. The plan establishes:

**Canonical Transaction Ownership:** Service layer owns transaction boundaries, repository layer participates.

**Canonical Locking Strategy:** Multi-layer locking (SELECT FOR UPDATE + advisory locks + optimistic concurrency).

**Canonical Optimistic Concurrency:** Version columns + compare-and-swap pattern.

**Canonical State Transitions:** Database constraints + atomic updates.

**Canonical Deduplication:** Database unique constraints are authoritative.

**Canonical Retry Consistency:** Service layer owns retries, advisory locks + atomic increment.

**Canonical Event Consistency:** Transactional event writes (outbox pattern deferred to multi-node phase).

**Canonical Failure Recovery:** Transaction rollback + retry orchestration.

The plan preserves runtime sovereignty, maintains canonical execution authority, and avoids architectural fragmentation. The incremental migration strategy minimizes runtime destabilization while achieving production-ready single-node execution integrity.

**Next Steps:**
1. Review and approve architecture plan
2. Begin Phase 1: Schema Foundation
3. Execute incremental migration per sequencing plan
4. Monitor and validate each phase
5. Achieve full certification after Phase 5

---

**END OF ARCHITECTURE PLAN**

**Plan Date:** 2025-01-20
**Plan Status:** COMPLETE
**Target:** Single-node execution integrity foundations
**Certification Status:** ⚠️ ARCHITECTURE DEFINED, AWAITING IMPLEMENTATION
