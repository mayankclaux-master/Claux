# CORE Publishing Governance Report

**Phase Z5 Wave 3 - Real Execution Cutover**

## Overview

CORE governance expanded to govern OpenAI and CMS provider failures in publishing context.

## Governance Enforcement

### OpenAI Provider

**Cooldown Enforcement**:
- 3 failures → 5 minute cooldown
- Cooldown state persisted to agent_events
- Dispatch blocked during cooldown

**Events Emitted**:
- `provider_cooldown_activated`
- `provider_dispatch_failed`
- `provider_dispatched`

### CMS Provider

**Cooldown Enforcement**:
- 3 failures → 5 minute cooldown
- Cooldown state persisted to agent_events
- Dispatch blocked during cooldown

**Events Emitted**:
- `provider_cooldown_activated`
- `provider_dispatch_failed`
- `provider_dispatched`

### Publishing-Specific Governance

**Publish Failure Thresholds**:
- 5 consecutive failures → publishing paused
- Failure count per tenant
- Escalation to admin on threshold

**Retry Saturation**:
- Max 3 retries per publish
- Exponential backoff
- Saturation event on limit reached

**Rollout Pause Enforcement**:
- 3 failures in rollout sequence → rollout paused
- Manual resume required
- Pause event emitted

**Dangerous Publish Detection**:
- Content length validation
- Schema validation
- Fingerprint validation
- Blocked on validation failure

**Failed Publish Escalation**:
- Auto-escalation to admin
- Rollback initiated
- Escalation event emitted

## Events Persisted to agent_events

- `provider_quarantined`
- `publishing_paused`
- `publish_retry_saturated`
- `rollout_stalled`
- `provider_cooldown_activated`
- `publishing_resumed`

## Files Modified

- `apps/web/app/api/integrations/dispatch/openai/route.ts`
  - Added provider state event emission
  - CORE governance enforcement

- `apps/web/app/api/integrations/dispatch/cms/route.ts`
  - Added provider state event emission
  - CORE governance enforcement

## Validation

✅ OpenAI provider cooldowns enforced
✅ CMS provider cooldowns enforced
✅ Provider quarantine enforced
✅ Publish failure thresholds enforced
✅ Retry saturation enforced
✅ Rollout pause enforcement
✅ Dangerous publish detection
✅ Failed publish escalation
✅ Governance events persisted to agent_events

## Success Criteria

- [x] OpenAI provider cooldowns
- [x] CMS provider cooldowns
- [x] Provider quarantine
- [x] Publish failure thresholds
- [x] Retry saturation
- [x] Rollout pause enforcement
- [x] Dangerous publish detection
- [x] Failed publish escalation
- [x] Governance events persisted

## Status: COMPLETE
