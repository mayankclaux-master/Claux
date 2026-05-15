# N8N RUNTIME BRIDGE REPORT

**Phase:** Phase Z2 - Provider Execution Convergence + Canonical n8n Runtime Migration  
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

## INTEGRATION DISPATCHER

**Location:** `lib/integrations/mesh/dispatchers/index.ts`

**Responsibilities:**
- Dispatch outbound integration jobs ✅
- Sign payloads ✅
- Attach execution IDs ✅
- Attach tenant IDs ✅
- Attach replay metadata ✅
- Attach trace metadata ✅
- Enforce idempotency ✅

**NO business logic.**
**ONLY transport + execution dispatch.**

## DISPATCH ROUTES

**Location:** `app/api/integrations/dispatch/`

**Routes Created:**
- `/api/integrations/dispatch/openai` ✅
- `/api/integrations/dispatch/dataforseo` ✅
- `/api/integrations/dispatch/gbp` ✅
- `/api/integrations/dispatch/gsc` ✅
- `/api/integrations/dispatch/cms` ✅

**Route Responsibilities:**
- Validate tenant ✅
- Sign payload ✅
- Generate correlation ID ✅
- Attach execution ID ✅
- Attach tenant ID ✅
- Attach replay metadata ✅
- Attach trace metadata ✅
- Dispatch to n8n ✅
- Generate dispatch receipt ✅

**NO BUSINESS LOGIC.**

## CALLBACK ROUTES

**Location:** `app/api/integrations/callback/`

**Routes Created:**
- `/api/integrations/callback/openai` ✅
- `/api/integrations/callback/dataforseo` ✅
- `/api/integrations/callback/gbp` ✅
- `/api/integrations/callback/gsc` ✅
- `/api/integrations/callback/cms` ✅

**Route Responsibilities:**
- Verify signatures ✅
- Validate replay safety ✅
- Prevent duplicates ✅
- Reconstruct runtime context ✅
- Emit runtime events ✅
- Continue execution safely ✅

**Callbacks MUST NEVER:**
- Mutate business state directly ✅
- Bypass runtime events ✅
- Complete tasks directly ✅

## CANONICAL BOUNDARY

**CLAUX Runtime:**
- Sole orchestration authority ✅
- Agent execution ✅
- Task execution ✅
- Event emission ✅
- Logging ✅
- Governance ✅
- Escalation ✅
- Recovery ✅
- Health monitoring ✅
- Anomaly detection ✅

**n8n:**
- Connector-only bridge ✅
- External API calls ✅
- CMS publishing ✅
- Data ingestion ✅
- Sync jobs ✅

## SUCCESS CRITERIA

✅ n8n is connector-only bridge
✅ No business logic in n8n
✅ No orchestration in n8n
✅ No governance in n8n
✅ No escalation in n8n
✅ No recovery in n8n
✅ Runtime remains sole orchestrator
✅ Dispatch routes created
✅ Callback routes created
✅ Integration dispatcher created
