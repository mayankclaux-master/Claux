# Dashboard Live Execution Report

**Phase Z6 - Production Activation**

## Overview

REAL execution telemetry bound into existing dashboard. No dashboard redesign - only data binding.

## Dashboard Components Updated

### Live Provider Execution

**Display**:
- Real-time provider execution status
- Provider health indicators
- Active executions count
- Execution queue depth

**Data Source**:
- `agent_executions` table
- Runtime event stream

### Dispatch State

**Display**:
- Dispatch success rate
- Dispatch latency
- Dispatch failures
- Dispatch retries

**Data Source**:
- `agent_events` table (provider_dispatched, provider_dispatch_failed)
- Integration dispatcher metrics

### Callback Continuation

**Display**:
- Callback success rate
- Callback latency
- Callback failures
- Callback retries

**Data Source**:
- `agent_events` table (integration_callback, callback_failed)
- Callback metrics

### Retries

**Display**:
- Retry count by provider
- Retry success rate
- Retry latency
- Retry saturation

**Data Source**:
- `agent_events` table (task_retry, retry_saturated)
- Retry metrics

### Provider Cooldowns

**Display**:
- Active cooldowns by provider
- Cooldown remaining time
- Cooldown history
- Cooldown frequency

**Data Source**:
- `agent_events` table (provider_cooldown_activated, provider_cooldown_expired)
- CORE governance state

### Provider Quarantine

**Display**:
- Quarantined providers
- Quarantine reason
- Quarantine duration
- Quarantine history

**Data Source**:
- `agent_events` table (provider_quarantined, provider_quarantine_lifted)
- CORE governance state

### Publishing State

**Display**:
- Publishing queue depth
- Active publishes
- Publish success rate
- Publish failures
- Rollbacks

**Data Source**:
- `agent_executions` table (AMPLI executions)
- `publishing_approvals` table
- `seo_drafts` table

### Recovery State

**Display**:
- Active recoveries
- Recovery success rate
- Recovery latency
- Recovery types

**Data Source**:
- `agent_events` table (worker_restart, n8n_outage, execution_continuation)
- Recovery metrics

### Tenant Execution State

**Display**:
- Per-tenant execution count
- Per-tenant success rate
- Per-tenant latency
- Per-tenant failures

**Data Source**:
- `agent_executions` table (grouped by tenant_id)
- Tenant-specific metrics

## Dashboard API Endpoints

All dashboard components use existing APIs:
- `/api/dashboard/telemetry` - General telemetry
- `/api/dashboard/providers` - Provider status
- `/api/dashboard/executions` - Execution status
- `/api/dashboard/publishing` - Publishing status
- `/api/dashboard/governance` - Governance status

## Real-Time Updates

Dashboard updates via:
- WebSocket connection to runtime events
- Polling fallback (5s interval)
- Event-driven updates on state changes

## Status: COMPLETE
