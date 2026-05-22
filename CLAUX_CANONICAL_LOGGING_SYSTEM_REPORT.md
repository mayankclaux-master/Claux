# CLAUX Canonical Logging System Report

**Report Date:** 2025-01-19
**Phase:** Phase 2B - Canonical Runtime Migration & Execution Authority Enforcement
**Status:** COMPLETED

## Executive Summary

This report documents the enforcement of canonical logging authority in the CLAUX system. The canonical logging system establishes LogService as the sole authority for persistent logging, ensuring all logs flow through a single, validated path with structured log levels, tenant isolation, and execution context. Phase 2B successfully eliminated all violations of canonical logging authority by removing the Agent Logger and ensuring all persistent logging uses LogService.

## Canonical Logging Architecture

### LogService
- **Location:** `apps/web/lib/runtime/services/log.service.ts`
- **Purpose:** Sole authority for persistent logging
- **Key Methods:**
  - `writeLog()` - Write a structured log entry
  - `writeError()` - Write an error log entry
  - `writeWarning()` - Write a warning log entry
  - `writeInfo()` - Write an info log entry
  - `writeDebug()` - Write a debug log entry

### LogRepository
- **Location:** `apps/web/lib/runtime/repositories/log.repository.ts`
- **Purpose:** Database access layer for agent_logs table
- **Access:** Only accessible via LogService (not directly)

### Canonical Log Table
- **Table:** agent_logs
- **Columns:**
  - id (UUID)
  - tenant_id (UUID) - Enforces tenant isolation
  - execution_id (UUID) - Links to execution
  - task_id (UUID) - Links to task
  - log_level (enum) - Log level (debug, info, warning, error)
  - message (text) - Log message
  - context (jsonb) - Additional context
  - created_at (timestamp)
  - updated_at (timestamp)

## Legacy Logging System Eliminated

### Agent Logger (DELETED)
- **File:** `apps/web/lib/agents/base/agent.logger.ts`
- **Purpose:** Legacy agent logging with direct table access
- **Violation:** Provided alternative logging path with direct DB inserts
- **Impact:** Created dual logging systems
- **Resolution:** DELETED in Phase 2B
- **Replacement:** LogService + structured logging

### Why Agent Logger Was Violative
1. **Dual Authority:** Created alternative logging path outside canonical services
2. **Direct DB Access:** Used direct inserts into agent_activities table (not agent_logs)
3. **Mixed Responsibilities:** Combined logging with state management and lock management
4. **No Structured Levels:** Lacked proper log level hierarchy
5. **No Tenant Isolation:** Did not enforce tenant_id filtering in all cases

## Canonical Logging Authority Enforcement

### Verification Results

#### Direct Inserts into agent_logs
- **Search Pattern:** `.insert(.*agent_logs`
- **Result:** NONE FOUND
- **Conclusion:** No direct inserts bypassing LogService

#### Logging Methods
- **Search Pattern:** `writeLog|log\.|console\.log`
- **Result:** 
  - Canonical runtime services use LogService.writeLog() and LogService.writeError()
  - Agent services use console.log as temporary structured logging (not persistent)
- **Conclusion:** Persistent logging authority enforced

### Files Using LogService

The following files correctly use canonical LogService:

#### Callback Validation
- `apps/web/lib/integrations/mesh/validation/publishing-callback-validation.ts`
  - Uses LogService.writeLog() for validation events
  - Uses LogService.writeError() for validation failures

- `apps/web/lib/integrations/mesh/validation/callback-continuation-validation.ts`
  - Uses LogService.writeLog() for continuation events
  - Uses LogService.writeError() for continuation failures

#### Provider Governance
- `apps/web/lib/integrations/mesh/governance/core-provider-governance.ts`
  - Uses LogService.writeLog() for governance events
  - Uses LogService.writeError() for provider failures

#### Multi-Tenant Validation
- `apps/web/lib/integrations/mesh/security/multi-tenant-validation.ts`
  - Uses LogService.writeLog() for validation events
  - Uses LogService.writeError() for security violations

#### Runtime Security
- `apps/web/lib/security/runtime-security.ts`
  - Uses LogService.writeLog() for security events

#### Execution Orchestrator
- `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`
  - Uses LogService.writeError() for execution failures
  - Auto-publishes logs for lifecycle transitions

#### Task Orchestrator
- `apps/web/lib/runtime/orchestrator/task-orchestrator.ts`
  - Uses LogService for task lifecycle logging

## Agent Services Logging

### Current State (Temporary)
Agent services use console.log as temporary structured logging:
- `apps/web/lib/agents/aria/aria.service.ts`
- `apps/web/lib/agents/scribe/scribe.service.ts`
- `apps/web/lib/agents/publish/publish.service.ts`
- `apps/web/lib/agents/locl/locl.service.ts`
- `apps/web/lib/agents/pulse/pulse.service.ts`

### Why Console Log is Acceptable
1. **Not Persistent:** console.log does not write to database
2. **Temporary Measure:** Provides observability during transition
3. **No Authority Violation:** Does not bypass LogService for persistent logging
4. **Structured Format:** Uses JSON structure for log aggregation

### Future Migration
Agent services should eventually be refactored to:
1. Accept RuntimeService in constructor
2. Use LogService for persistent logging
3. Maintain structured log format
4. Remove console.log calls

## Log Level Hierarchy

### Canonical Log Levels
- **DEBUG:** Detailed diagnostic information
- **INFO:** General informational messages
- **WARNING:** Warning messages for potential issues
- **ERROR:** Error messages for failures

### Usage Guidelines
- Use DEBUG for detailed execution tracing
- Use INFO for normal operation milestones
- Use WARNING for non-critical issues
- Use ERROR for failures requiring attention

### Implementation
```typescript
// LogService provides level-specific methods
await this.runtime.log.writeInfo(executionId, taskId, "Operation completed");
await this.runtime.log.writeWarning(executionId, taskId, "Potential issue detected");
await this.runtime.log.writeError(executionId, taskId, "Operation failed", { error });
```

## Tenant Isolation in Logs

### Enforcement
- **Method:** tenant_id column in agent_logs table
- **Validation:** LogService requires tenant_id in constructor
- **Filtering:** All log queries include tenant_id filter

### Example
```typescript
// LogService constructor enforces tenant isolation
constructor(config: LogServiceConfig) {
  this.config = config;
  this.repository = new LogRepository(config.tenantId);
}

// LogRepository enforces tenant_id in all queries
class LogRepository {
  constructor(private tenantId: UUID) {
    // All queries automatically include tenant_id filter
  }
}
```

## Execution Context in Logs

### Execution ID Linking
- **Purpose:** Link logs to specific executions
- **Usage:** execution_id column in agent_logs table
- **Benefit:** Reconstruct execution timeline from logs

### Task ID Linking
- **Purpose:** Link logs to specific tasks
- **Usage:** task_id column in agent_logs table
- **Benefit:** Track task-level execution details

### Context Metadata
- **Purpose:** Additional structured context
- **Usage:** context column (jsonb) in agent_logs table
- **Benefit:** Rich, queryable log metadata

## Log Consumption

### Canonical Log Consumption
Logs are consumed through:
1. **Execution Timeline:** Reconstructs execution timeline from logs
2. **Dashboard:** Displays execution logs
3. **Debugging:** Troubleshoot execution issues
4. **Forensics:** Analyze execution patterns
5. **Metrics:** Calculate error rates and performance metrics

### Log Queries
All log consumption queries include tenant_id filtering:
```typescript
// Example: Execution timeline
const { data: logs } = await supabase
  .from("agent_logs")
  .select("*")
  .eq("tenant_id", tenantId)  // Tenant isolation enforced
  .eq("execution_id", executionId)
  .order("created_at", { ascending: true });
```

## Logging Authority Laws

### Law 1: Persistent Logging Monopoly
- **Statement:** LogService is the sole authority for persistent logging
- **Enforcement:** No code may directly insert into agent_logs table
- **Violations:** Direct table inserts, agent-owned logging
- **Status:** ENFORCED

### Law 2: Structured Logging Mandate
- **Statement:** All logs must use structured format
- **Enforcement:** LogService requires structured log objects
- **Violations:** Unstructured log messages
- **Status:** ENFORCED

### Law 3: Tenant Isolation Mandate
- **Statement:** All logs must be tenant-isolated
- **Enforcement:** LogService requires tenant_id in constructor
- **Violations:** Cross-tenant log publishing
- **Status:** ENFORCED

### Law 4: Log Level Hierarchy Mandate
- **Statement:** All logs must use appropriate log levels
- **Enforcement:** LogService provides level-specific methods
- **Violations:** Incorrect log level usage
- **Status:** ENFORCED

### Law 5: Execution Context Mandate
- **Statement:** All logs must include execution context
- **Enforcement:** LogService requires execution_id
- **Violations:** Logs without execution context
- **Status:** ENFORCED

## Migration from Legacy System

### Before Phase 2B
- **Logging Authority:** Agent Logger (direct table inserts)
- **Table:** agent_activities (not canonical agent_logs)
- **Structure:** Unstructured activity messages
- **Tenant Isolation:** Partially enforced
- **Log Levels:** Not defined
- **Execution Context:** Mixed with state management

### After Phase 2B
- **Logging Authority:** LogService (canonical)
- **Table:** agent_logs (canonical)
- **Structure:** Structured log levels and context
- **Tenant Isolation:** Enforced via tenant_id
- **Log Levels:** DEBUG, INFO, WARNING, ERROR
- **Execution Context:** execution_id, task_id, context metadata

## Compliance Status

### Before Phase 2B
- **Logging Authority:** VIOLATED (Agent Logger + direct inserts)
- **Structured Logging:** VIOLATED (unstructured messages)
- **Tenant Isolation:** VIOLATED (not enforced)
- **Log Levels:** VIOLATED (not defined)
- **Execution Context:** VIOLATED (mixed responsibilities)

### After Phase 2B
- **Logging Authority:** COMPLIANT (LogService only)
- **Structured Logging:** COMPLIANT (structured format)
- **Tenant Isolation:** COMPLIANT (enforced via tenant_id)
- **Log Levels:** COMPLIANT (defined hierarchy)
- **Execution Context:** COMPLIANT (execution_id, task_id, context)

## Recommendations

### Immediate Actions
1. Continue monitoring for any new persistent logging outside LogService
2. Educate team on canonical logging system architecture
3. Update documentation to reflect LogService as sole authority

### Future Work
1. Refactor agent services to use LogService instead of console.log
2. Add log aggregation and analytics
3. Implement log retention policies
4. Add log-based alerting system
5. Implement log search and filtering UI

## Conclusion

Phase 2B successfully enforced canonical logging authority in the CLAUX system by eliminating the Agent Logger and ensuring all persistent logging flows through LogService. The canonical logging system now provides structured log levels, tenant isolation, and execution context. All persistent logs are published through a single, validated path with proper log level hierarchy and execution context linking. Agent services use console.log as a temporary measure for observability, which does not violate canonical logging authority since it is not persistent.

**Canonical Logging System Enforcement Status: COMPLETED**
