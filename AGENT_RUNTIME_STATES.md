# AGENT RUNTIME STATES

**Module:** CLAUX Agent Runtime States  
**Date:** 2026-05-10  
**Status:** DEFINED

---

## Overview

This document defines the agent runtime states including canonical lifecycle states, transitions, invariants, failure conditions, and replay semantics.

---

## Canonical Lifecycle States

### INITIALIZING
Agent is initializing

### IDLE
Agent is idle

### PLANNING
Agent is planning

### EXECUTING
Agent is executing

### BLOCKED
Agent is blocked

### RECOVERING
Agent is recovering

### REPLAYING
Agent is replaying

### DEGRADED
Agent is degraded

### SUSPENDED
Agent is suspended

### TERMINATED
Agent is terminated

---

## State Machines by Agent

### PLANNER
**Valid States:** INITIALIZING, IDLE, PLANNING, BLOCKED, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- PLANNING: planning_authority_granted
- IDLE: no_active_tasks

**Failure Conditions:**
- policy_violation → BLOCKED
- critical_failure → RECOVERING

**Replay Semantics:**
- PLANNING: replayable, checkpoint required
- IDLE: replayable, no checkpoint required

### EXECUTOR
**Valid States:** INITIALIZING, IDLE, EXECUTING, BLOCKED, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- EXECUTING: execution_claim_granted
- IDLE: no_active_tasks

**Failure Conditions:**
- execution_failure → RECOVERING
- execution_timeout → RECOVERING

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required
- REPLAYING: replayable, checkpoint required

### VALIDATOR
**Valid States:** INITIALIZING, IDLE, EXECUTING, BLOCKED, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- EXECUTING: validation_authority_granted

**Failure Conditions:**
- validation_failure → BLOCKED

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required

### GOVERNOR
**Valid States:** INITIALIZING, IDLE, EXECUTING, BLOCKED, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- EXECUTING: governance_authority_granted
- IDLE: no_pending_approvals

**Failure Conditions:**
- critical_failure → TERMINATED

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required

### ANALYZER
**Valid States:** INITIALIZING, IDLE, EXECUTING, BLOCKED, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:** None

**Failure Conditions:**
- analysis_failure → RECOVERING

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required

### ROUTER
**Valid States:** INITIALIZING, IDLE, EXECUTING, BLOCKED, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- EXECUTING: routing_authority_granted

**Failure Conditions:**
- routing_conflict → BLOCKED
- resource_exhaustion → RECOVERING

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required

### SIMULATOR
**Valid States:** INITIALIZING, IDLE, PLANNING, BLOCKED, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:** None

**Failure Conditions:** None

**Replay Semantics:**
- PLANNING: replayable, checkpoint required
- REPLAYING: replayable, checkpoint required

### RECOVERER
**Valid States:** INITIALIZING, IDLE, EXECUTING, RECOVERING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:**
- RECOVERING: recovery_authority_granted

**Failure Conditions:** None

**Replay Semantics:**
- RECOVERING: replayable, checkpoint required

### OBSERVER
**Valid States:** INITIALIZING, IDLE, EXECUTING, REPLAYING, SUSPENDED, TERMINATED

**Initial State:** INITIALIZING

**Key Invariants:** None

**Failure Conditions:** None

**Replay Semantics:**
- EXECUTING: replayable, checkpoint required

---

## Common State Transitions

- INITIALIZING → IDLE (initialization_complete)
- IDLE → PLANNING (plan_requested)
- IDLE → EXECUTING (execute_requested)
- IDLE → BLOCKED (blocked_condition)
- PLANNING → IDLE (plan_complete)
- PLANNING → BLOCKED (planning_blocked)
- EXECUTING → IDLE (execution_complete)
- EXECUTING → RECOVERING (execution_failed)
- BLOCKED → IDLE (block_cleared)
- RECOVERING → IDLE (recovery_complete)
- RECOVERING → DEGRADED (recovery_partial)
- REPLAYING → IDLE (replay_complete)
- DEGRADED → IDLE (degradation_cleared)
- SUSPENDED → IDLE (suspension_lifted)
- TERMINATED → INITIALIZING (reinitialization_requested)

---

## Conclusion

The CLAUX Agent Runtime States provide a comprehensive state machine framework with defined transitions, invariants, failure conditions, and replay semantics for all 9 canonical agents. The state machines ensure deterministic and recoverable agent behavior.

**Overall Status:** DEFINED
