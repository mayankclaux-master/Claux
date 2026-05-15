# AGENT MEMORY MODEL

**Module:** CLAUX Agent Memory Model  
**Date:** 2026-05-10  
**Status:** DEFINED

---

## Overview

This document defines the agent memory model including working memory, episodic memory, semantic memory, execution memory, replay memory, checkpoint semantics, shared memory access, isolation boundaries, persistence semantics, and memory ownership for each agent.

---

## Memory Types

### WORKING
Short-term working memory for immediate operations.

### EPISODIC
Episode-based memory for sequential event storage.

### SEMANTIC
Semantic knowledge memory for structured information.

### EXECUTION
Execution state memory for tracking execution progress.

### REPLAY
Replay history memory for deterministic replay.

### CHECKPOINT
Checkpoint state memory for recovery and restore.

---

## Memory Ownership by Agent

### PLANNER
- **WORKING:** EXCLUSIVE
- **EPISODIC:** EXCLUSIVE
- **SEMANTIC:** SHARED (with SIMULATOR, ANALYZER)
- **EXECUTION:** EXCLUSIVE
- **REPLAY:** EXCLUSIVE

**Checkpoint Frequency:** 60 seconds  
**Checkpoint Retention:** 3600 seconds

### EXECUTOR
- **WORKING:** EXCLUSIVE
- **EXECUTION:** EXCLUSIVE
- **REPLAY:** EXCLUSIVE
- **CHECKPOINT:** EXCLUSIVE

**Checkpoint Frequency:** 30 seconds  
**Checkpoint Retention:** 1800 seconds

### VALIDATOR
- **WORKING:** EXCLUSIVE
- **EPISODIC:** EXCLUSIVE
- **SEMANTIC:** SHARED (with GOVERNOR)
- **EXECUTION:** EXCLUSIVE

**Checkpoint Frequency:** 120 seconds  
**Checkpoint Retention:** 7200 seconds

### GOVERNOR
- **WORKING:** EXCLUSIVE
- **SEMANTIC:** EXCLUSIVE
- **EXECUTION:** EXCLUSIVE
- **REPLAY:** EXCLUSIVE

**Checkpoint Frequency:** 300 seconds  
**Checkpoint Retention:** 86400 seconds

### ANALYZER
- **WORKING:** EXCLUSIVE
- **EPISODIC:** EXCLUSIVE
- **SEMANTIC:** EXCLUSIVE

**Checkpoint Frequency:** 600 seconds  
**Checkpoint Retention:** 43200 seconds

### ROUTER
- **WORKING:** EXCLUSIVE
- **EXECUTION:** EXCLUSIVE
- **CHECKPOINT:** EXCLUSIVE

**Checkpoint Frequency:** 30 seconds  
**Checkpoint Retention:** 1800 seconds

### SIMULATOR
- **WORKING:** EXCLUSIVE
- **EPISODIC:** EXCLUSIVE
- **SEMANTIC:** SHARED (with PLANNER)
- **REPLAY:** EXCLUSIVE

**Checkpoint Frequency:** 120 seconds  
**Checkpoint Retention:** 7200 seconds

### RECOVERER
- **WORKING:** EXCLUSIVE
- **EXECUTION:** EXCLUSIVE
- **CHECKPOINT:** EXCLUSIVE
- **REPLAY:** EXCLUSIVE

**Checkpoint Frequency:** 60 seconds  
**Checkpoint Retention:** 86400 seconds

### OBSERVER
- **WORKING:** EXCLUSIVE
- **EXECUTION:** EXCLUSIVE
- **REPLAY:** EXCLUSIVE
- **CHECKPOINT:** EXCLUSIVE

**Checkpoint Frequency:** 30 seconds  
**Checkpoint Retention:** 3600 seconds

---

## Memory Isolation Boundaries

### AGENT_ISOLATED
Memory isolated to individual agent.

### SESSION_ISOLATED
Memory isolated to session scope.

### WORKFLOW_ISOLATED
Memory isolated to workflow scope.

### TASK_BOUNDARY
Memory isolated to task boundary.

### SYSTEM_BOUNDARY
Memory isolated to system boundary.

### SHARED
Shared memory across agents.

---

## Memory Access Permissions

### PLANNER
- WORKING: READ_WRITE (AGENT_ISOLATED)
- EPISODIC: READ_WRITE (SESSION_ISOLATED)
- SEMANTIC: READ_WRITE (SHARED)
- EXECUTION: READ_ONLY (WORKFLOW_ISOLATED for EXECUTOR)

### EXECUTOR
- WORKING: READ_WRITE (AGENT_ISOLATED)
- EXECUTION: READ_WRITE (TASK_BOUNDARY)
- EXECUTION: READ_ONLY (WORKFLOW_ISOLATED for PLANNER)

### VALIDATOR
- WORKING: READ_WRITE (AGENT_ISOLATED)
- EXECUTION: READ_WRITE (WORKFLOW_ISOLATED)
- SEMANTIC: READ_ONLY (SHARED for GOVERNOR)

### GOVERNOR
- WORKING: READ_WRITE (AGENT_ISOLATED)
- SEMANTIC: READ_WRITE (SYSTEM_BOUNDARY)

### ANALYZER
- WORKING: READ_WRITE (AGENT_ISOLATED)
- SEMANTIC: READ_ONLY (SHARED for PLANNER)

### ROUTER
- WORKING: READ_WRITE (AGENT_ISOLATED)
- EXECUTION: READ_WRITE (SESSION_ISOLATED)

### SIMULATOR
- WORKING: READ_WRITE (AGENT_ISOLATED)
- REPLAY: READ_ONLY (WORKFLOW_ISOLATED for PLANNER)

### RECOVERER
- WORKING: READ_WRITE (AGENT_ISOLATED)
- CHECKPOINT: READ_WRITE (SYSTEM_BOUNDARY)

### OBSERVER
- WORKING: READ_WRITE (AGENT_ISOLATED)
- EXECUTION: READ_WRITE (SYSTEM_BOUNDARY)

---

## Memory Routing Semantics

Memory routing follows the agent topology hierarchy. Strategic agents (PLANNER, GOVERNOR, RECOVERER, OBSERVER) have system-level memory access. Tactical agents (ROUTER, SIMULATOR, ANALYZER) have workflow/session-level memory access. Operational agents (EXECUTOR, VALIDATOR) have task-level memory access.

---

## Memory Synchronization Semantics

- **Immediate:** Critical governance and recovery operations
- **Eventual:** Analysis and simulation operations
- **On Demand:** Replay and checkpoint operations

---

## Memory Replay Semantics

All memory types support deterministic replay:
- **Replay Scope:** agent, session, workflow, or system
- **Replay Preservation:** full, partial, or metadata_only
- **Replay Safety:** All memory operations are replay-safe

---

## Conclusion

The CLAUX Agent Memory Model provides a comprehensive memory ownership and access framework for all 9 canonical agents. Memory is properly isolated, checkpointed, and made replay-safe to support deterministic execution and recovery.

**Overall Status:** DEFINED
