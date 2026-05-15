# WORKER HEALTH REPORT

**Component:** Worker Health & Autorecovery  
**File:** `lib/runtime/worker/worker-health.ts`

## FEATURES
- Worker heartbeat monitoring
- Stale worker detection
- Worker draining
- Worker reassignment
- Unhealthy worker quarantine
- Graceful shutdown handling

## SAFETY
- Rolling restart safety
- Replay-safe reassignment
- Execution continuity guaranteed
