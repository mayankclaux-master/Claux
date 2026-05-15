# CLAUX Agent Runtime - Example Workflows

This directory contains example workflows demonstrating the CLAUX Agent Runtime System.

## LOCL Audit Workflow

**File**: `locl-audit-workflow.ts`

Demonstrates a complete event-driven workflow:

### Workflow Flow

1. **LOCL Audit Completes** → Emits `locl.audit.completed` event
2. **Event Triggers Workflow** → Inngest picks up the event
3. **Workflow Executes Tasks**:
   - Task 1: Analyze audit results
   - Task 2: Generate content recommendations (AI generation)
   - Task 3: Create follow-up tasks
4. **Emits Completion Event** → `workflow.completed` event
5. **Logs Full Lifecycle** → All steps tracked in database

### Key Runtime Features Demonstrated

- **Execution Registration**: Workflow execution tracked in `agent_executions`
- **Task Tracking**: Each task tracked in `agent_tasks` with status, duration, retries
- **Event Emission**: Events emitted at key workflow points
- **Logging**: Structured logs for debugging and observability
- **Retry Handling**: Automatic retry on task failures
- **Cost Tracking**: Token and cost tracking throughout execution
- **Observability**: Execution timeline and diagnostics available

### Running the Example

```typescript
import { runExampleWorkflow } from './locl-audit-workflow';

await runExampleWorkflow();
```

### Inngest Integration

The workflow includes an Inngest function `loclAuditCompletedWorkflow` that can be registered with Inngest to handle events:

```typescript
import { inngest } from '../lib/workflows/inngest-client';
import { loclAuditCompletedWorkflow } from './locl-audit-workflow';

export const loclAuditCompletedHandler = inngest.createFunction(
  { id: 'locl-audit-completed-handler' },
  { event: 'locl/audit.completed' },
  loclAuditCompletedWorkflow
);
```

## Observability Example

After running a workflow, you can query execution history:

```typescript
import { ExecutionTracer } from '../lib/observability/tracer';

const tracer = new ExecutionTracer(db);
const timeline = await tracer.getExecutionTimeline(executionId);
const diagnostics = await tracer.getDiagnostics(executionId);
```

This provides:
- Complete execution timeline
- Task-by-task breakdown
- Error diagnostics
- Performance recommendations
