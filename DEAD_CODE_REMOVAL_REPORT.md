# DEAD CODE REMOVAL REPORT

**Phase:** Phase 2A - Live Runtime Convergence + Dashboard Binding  
**Status:** COMPLETED

## REMOVED FROM DASHBOARD
- Dependency on aria_keywords table
- Dependency on scribe_content table
- Dependency on agent_states table
- Dependency on agent_activities table
- Dependency on pulse_rankings table
- Dependency on locl_audits table
- Dependency on publish_jobs table

## PRESERVED
- Canonical runtime (RuntimeService, ExecutionOrchestrator, Runtime Kernel)
- Canonical execution flow
- Active production paths (ARIA, SCRIBE)

## LEGACY CODE (TO BE REMOVED)
- app/api/v1/agent-update/route.ts
- app/api/v1/orchestrator/trigger-agent/route.ts
- app/api/dev/simulate-agent/route.ts
- lib/agents/aria.service.ts
- lib/agents/scribe.service.ts

## LEGACY TABLES (CAN BE DROPPED)
- aria_keywords
- scribe_content
- agent_states
- agent_activities
