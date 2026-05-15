# N8N BOUNDARY ARCHITECTURE

**Phase:** Phase Z1 - Integration Mesh Foundation + Canonical API Topology  
**Status:** COMPLETED

## N8N RESPONSIBILITIES

**ONLY:**
- External API execution
- CMS publishing execution
- Data ingestion
- Sync jobs
- External ingestion

**NOT:**
- Business logic
- Orchestration
- Governance
- Escalation
- Recovery intervention
- Queue intervention
- Runtime health
- Anomaly detection

## CANONICAL BOUNDARY

**CLAUX Runtime:**
- Sole orchestration authority
- Agent execution
- Task execution
- Event emission
- Logging
- Governance
- Escalation
- Recovery
- Health monitoring
- Anomaly detection

**n8n:**
- Connector-only bridge
- External API calls
- CMS publishing
- Data ingestion
- Sync jobs

## INTEGRATION DISPATCHER

**Location:** `apps/web/lib/integrations/mesh/dispatchers/index.ts`

**Responsibilities:**
- Dispatch outbound integration jobs
- Sign payloads
- Attach execution IDs
- Attach tenant IDs
- Attach replay metadata
- Attach trace metadata
- Enforce idempotency

**NO business logic.**
**ONLY transport + execution dispatch.**

## SUCCESS CRITERIA

✅ n8n is connector-only bridge
✅ No business logic in n8n
✅ No orchestration in n8n
✅ No governance in n8n
✅ No escalation in n8n
✅ No recovery in n8n
✅ Runtime remains sole orchestrator
