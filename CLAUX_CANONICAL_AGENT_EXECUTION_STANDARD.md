# CLAUX Canonical Agent Execution Standard

**Version:** V1
**Architecture:** CLAUX V1 HYBRID (AI intelligence + Human execution)
**Date:** 2026-05-23

---

## PRINCIPLE

This is the PERMANENT execution standard for ALL CLAUX V1 agents.

Every agent MUST execute identically.

NO variation allowed.

---

## MANDATORY LIFECYCLE

### Step 1: API Route Receives Request

**Entry Point:** `/api/v1/agent-trigger`

**Input:**
```typescript
{
  agent: 'ARIA' | 'SCRIBE' | 'PUBLISH' | 'PULSE' | 'LOCL' | 'REPUTE' | 'LINX' | 'PRISM' | 'CORE',
  tenantId: string,
  runId: string,
  input: Record<string, unknown>
}
```

**Validation:**
- Validate tenant exists
- Validate agent is authorized
- Validate input schema

---

### Step 2: Agent Validates Tenant/Auth

**Action:**
- Verify tenant_id is valid
- Verify user has permission to trigger agent
- Verify tenant is active

**Failure:** Return 401/403 error

---

### Step 3: RuntimeService Creates Execution

**Action:**
```typescript
const runtimeService = new RuntimeService({
  tenantId: tenantId as UUID,
  logOperations: true,
  enableMetrics: true,
});

const createExecutionResult = await runtimeService.execution.createExecution({
  agent_name: 'AGENT_NAME',
  workflow_type: 'workflow_type',
  metadata: {},
  execution_source: ExecutionSource.API,
});
```

**State:** pending → running

**Failure:** Return 500 error

---

### Step 4: RuntimeService Creates Tasks

**Action:**
```typescript
const taskResult = await runtimeService.task.createTask({
  execution_id: runtimeExecutionId,
  task_name: 'task_name',
  task_type: 'task_type',
  step_order: 1,
  input_payload: {},
});
```

**State:** pending

**Failure:** Fail execution, return 500 error

---

### Step 5: Agent Executes External APIs

**Action:**
- Call external APIs (DataForSEO, OpenAI, etc.)
- Process results
- Store outputs in agent-specific tables

**State:** running

**Failure:** Fail task, fail execution

---

### Step 6: Agent Stores Outputs

**Action:**
- Store results in agent-specific tables
- (e.g., aria_keywords, scribe_content, etc.)
- Use Supabase client with tenant isolation

**Failure:** Log error, continue if non-critical

---

### Step 7: Agent Creates Command Center Tasks

**Action:**
```typescript
const taskGenerationService = new TaskGenerationService();

const commandCenterTasks = [
  {
    task_type: 'task_type' as TaskType,
    title: 'Task title',
    description: 'Task description',
    priority: 'high' as TaskPriority,
    action_payload: {},
  },
];

await taskGenerationService.bulkCreateTasks({
  tenant_id: tenantId as string,
  client_id: tenantId as string,
  agent_name: 'AGENT_NAME',
  source_execution_id: runtimeExecutionId,
  source_task_id: taskId,
  tasks: commandCenterTasks,
});
```

**Purpose:** Generate human-executable tasks

**Failure:** Log error, continue if non-critical

---

### Step 8: RuntimeService Updates Execution State

**Action:**
```typescript
// Complete task
if (result.status === 'completed') {
  await runtimeService.task.completeTask(taskId, result.output);
} else {
  await runtimeService.task.failTask(taskId, {...});
}

// Complete execution
await runtimeService.execution.completeExecution(runtimeExecutionId, cost);
```

**State:** running → completed/failed

**Failure:** Log error, attempt recovery

---

### Step 9: Activity Feed Updates Automatically

**Action:**
- Activity feed automatically updates via DB triggers
- No manual intervention required
- Feed reflects real DB state

---

### Step 10: Dashboard Reflects Real DB State

**Action:**
- Dashboard queries real DB tables
- No fake data, no mock data
- Real-time reflection of agent executions

---

## EXECUTION STATES

### Execution States (Canonical)

**Mandatory:**
- `pending` - Execution created, not started
- `running` - Execution in progress
- `completed` - Execution finished successfully
- `failed` - Execution failed

**NO additional states allowed.**

### Task States (Canonical)

**Mandatory:**
- `pending` - Task created, not started
- `in_progress` - Task in progress
- `completed` - Task finished successfully
- `blocked` - Task blocked (cannot proceed)

**NO additional states allowed.**

---

## COMMAND CENTER OUTPUTS

### Mandatory Fields

Every Command Centre task MUST include:

```typescript
{
  task_type: TaskType,
  title: string,
  description: string,
  priority: TaskPriority,
  action_payload: Record<string, unknown>,
  recommended_action?: string,
  client_visible_impact?: string
}
```

### Human-Readable Requirements

**Title:** Clear, actionable, copy-paste ready
**Description:** Detailed instructions for human execution
**Priority:** critical, high, medium, low
**Action Payload:** All data needed for execution
**Recommended Action:** (optional) Specific action recommendation
**Client Visible Impact:** (optional) Business impact for client

### Example

```typescript
{
  task_type: 'keyword_review',
  title: 'Create landing page for "seo services"',
  description: 'Optimize content for keyword: seo services (difficulty: 45)',
  priority: 'high',
  action_payload: {
    keyword: 'seo services',
    difficulty: 45,
    search_volume: 1200,
  },
  recommended_action: 'Write 1000-word article targeting this keyword',
  client_visible_impact: 'Expected traffic increase: 150-200 visits/month'
}
```

---

## DASHBOARD OUTPUTS

### ARIA Dashboard Metrics

```typescript
{
  keyword_opportunities: number,
  keyword_difficulty: number,
  ranking_movement: number,
  total_keywords: number
}
```

### SCRIBE Dashboard Metrics

```typescript
{
  content_generated: number,
  content_score: number,
  publishing_readiness: number,
  word_count: number
}
```

### PUBLISH Dashboard Metrics

```typescript
{
  publishing_packages_ready: number,
  metadata_generated: number,
  schema_generated: number,
  image_prompts_generated: number
}
```

### PULSE Dashboard Metrics

```typescript
{
  ranking_changes: number,
  visibility_movement: number,
  average_position: number,
  total_keywords_tracked: number
}
```

### LOCL Dashboard Metrics

```typescript
{
  gmb_optimization_score: number,
  citation_opportunities: number,
  local_ranking: number,
  total_locations: number
}
```

### REPUTE Dashboard Metrics

```typescript
{
  reviews_pending_reply: number,
  sentiment_trends: number,
  average_rating: number,
  total_reviews: number
}
```

### LINX Dashboard Metrics

```typescript
{
  backlink_opportunities: number,
  outreach_targets: number,
  domain_authority: number,
  total_backlinks: number
}
```

### PRISM Dashboard Metrics

```typescript
{
  traffic_analytics: number,
  conversion_summaries: number,
  bounce_rate: number,
  total_sessions: number
}
```

### CORE Dashboard Metrics

```typescript
{
  technical_health: number,
  schema_issues: number,
  crawl_issues: number,
  total_pages_audited: number
}
```

---

## RUNTIMESERVICE USAGE

### Initialization

```typescript
const runtimeService = new RuntimeService({
  tenantId: tenantId as UUID,
  logOperations: true,
  enableMetrics: true,
});
```

### Execution Operations

```typescript
// Create execution
const createExecutionResult = await runtimeService.execution.createExecution({
  agent_name: 'AGENT_NAME',
  workflow_type: 'workflow_type',
  metadata: {},
  execution_source: ExecutionSource.API,
});

// Start execution
await runtimeService.execution.startExecution(runtimeExecutionId);

// Complete execution
await runtimeService.execution.completeExecution(runtimeExecutionId, cost);

// Fail execution
await runtimeService.execution.failExecution(runtimeExecutionId, error);
```

### Task Operations

```typescript
// Create task
const taskResult = await runtimeService.task.createTask({
  execution_id: runtimeExecutionId,
  task_name: 'task_name',
  task_type: 'task_type',
  step_order: 1,
  input_payload: {},
});

// Start task
await runtimeService.task.startTask(taskId);

// Complete task
await runtimeService.task.completeTask(taskId, output);

// Fail task
await runtimeService.task.failTask(taskId, error);
```

### Logging Operations

```typescript
await runtimeService.log.writeInfo(
  executionId,
  taskId,
  "Log message",
  { metadata }
);

await runtimeService.log.writeError(
  executionId,
  taskId,
  "Error message",
  { error }
);
```

---

## COMMAND CENTER INTEGRATION

### Task Generation Service

```typescript
const taskGenerationService = new TaskGenerationService();

await taskGenerationService.bulkCreateTasks({
  tenant_id: tenantId as string,
  client_id: tenantId as string,
  agent_name: 'AGENT_NAME',
  source_execution_id: runtimeExecutionId,
  source_task_id: taskId,
  tasks: commandCenterTasks,
});
```

### Task Types

**Canonical Task Types:**
- `keyword_review` - Review keyword opportunities
- `content_review` - Review generated content
- `publishing_package` - Upload content to CMS
- `schema_implementation` - Implement schema markup
- `ranking_monitor` - Monitor ranking changes
- `gmb_optimization` - Optimize GMB profile
- `review_reply` - Reply to reviews
- `backlink_outreach` - Outreach for backlinks
- `analytics_review` - Review analytics data
- `technical_audit` - Fix technical issues

---

## ERROR HANDLING

### Execution Failure

```typescript
try {
  // Execute agent logic
} catch (error) {
  await runtimeService.execution.failExecution(runtimeExecutionId, {
    message: error.message,
    code: 'EXECUTION_ERROR',
  });
}
```

### Task Failure

```typescript
try {
  // Execute task logic
} catch (error) {
  await runtimeService.task.failTask(taskId, {
    message: error.message,
    code: 'TASK_ERROR',
  });
}
```

### Logging Errors

```typescript
await runtimeService.log.writeError(
  executionId,
  taskId,
  "Error message",
  { error: error.message, stack: error.stack }
);
```

---

## TIMEOUT HANDLING

### Execution Timeout

```typescript
const EXECUTION_TIMEOUT_MS = 30000; // 30 seconds

const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
});

try {
  await Promise.race([
    executeAgent(context, executionId),
    timeoutPromise
  ]);
} catch (error) {
  await runtimeService.execution.failExecution(runtimeExecutionId, {
    message: "Execution timeout exceeded",
    code: 'TIMEOUT_ERROR',
  });
}
```

---

## DATA PERSISTENCE

### Agent-Specific Tables

Each agent MUST store outputs in its own table:

- ARIA: `aria_keywords`
- SCRIBE: `scribe_content`
- PUBLISH: `publish_packages` (NEW)
- PULSE: `pulse_rankings`
- LOCL: `locl_gmb_data`
- REPUTE: `repute_reviews`
- LINX: `linx_backlinks`
- PRISM: `prism_assets`
- CORE: `core_audit_logs`

### Tenant Isolation

All tables MUST have:
- `tenant_id` column
- RLS policies
- Tenant-scoped indexes

---

## COMPLIANCE CHECKLIST

### Required for All Agents

- [ ] Uses RuntimeService directly (no orchestrator)
- [ ] Creates execution via RuntimeService
- [ ] Starts execution via RuntimeService
- [ ] Creates tasks via RuntimeService
- [ ] Starts tasks via RuntimeService
- [ ] Completes/fails tasks via RuntimeService
- [ ] Completes/fails execution via RuntimeService
- [ ] Uses RuntimeService LogService for logging
- [ ] Generates Command Centre tasks
- [ ] Uses canonical execution states only
- [ ] Uses canonical task states only
- [ ] Stores outputs in agent-specific tables
- [ ] Provides dashboard metrics
- [ ] No CMS automation (PUBLISH agent)
- [ ] No queues
- [ ] No workflows
- [ ] No distributed runtime
- [ ] No hidden orchestration

---

## FORBIDDEN PATTERNS

### DO NOT Use

- ❌ Orchestrator pattern
- ❌ Queue systems
- ❌ Workflow engines
- ❌ Event sourcing
- ❌ CMS adapters
- ❌ Direct database access (use Supabase client)
- ❌ Direct provider calls (use RuntimeService)
- ❌ Abstract factories
- ❌ Strategy patterns
- ❌ Enterprise architecture patterns
- ❌ Future-proofing abstractions

### DO Use

- ✅ RuntimeService directly
- ✅ Simple functions
- ✅ Direct API calls
- ✅ Supabase client
- ✅ TaskGenerationService
- ✅ Canonical types
- ✅ Deterministic execution

---

## ARCHITECTURE PRINCIPLES

### Simplicity

- No over-engineering
- No speculative features
- No future-facing systems
- Keep it simple, keep it working

### Determinism

- Same input = same output
- No random behavior
- No hidden state
- Predictable execution

### Transparency

- All logging via RuntimeService
- All data in canonical tables
- Real dashboard data only
- No fake data, no mock data

### Human-in-the-Loop

- Agents generate tasks
- Humans execute tasks
- No autonomous execution
- No CMS automation

---

## IMPLEMENTATION ORDER

### Phase 4B (Current)
1. ✅ Forensic analysis
2. ✅ Canonical execution contract
3. ⏳ Create base types
4. ⏳ Standardize execution states
5. ⏳ Standardize command center outputs
6. ⏳ Standardize dashboard outputs
7. ⏳ Rewrite PUBLISH agent
8. ⏳ Verify ARIA/SCRIBE compliance

### Future Phases
9. Implement PULSE agent
10. Implement LOCL agent
11. Implement REPUTE agent
12. Implement LINX agent
13. Implement PRISM agent
14. Implement CORE agent

---

## CONCLUSION

This is the PERMANENT execution standard for CLAUX V1.

All agents MUST follow this standard.

NO exceptions.

NO variations.

This becomes the foundation for all future agent development.
