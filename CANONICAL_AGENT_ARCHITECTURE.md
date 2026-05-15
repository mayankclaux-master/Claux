# CANONICAL AGENT ARCHITECTURE

**Module:** CLAUX Agent System  
**Date:** 2026-05-10  
**Status:** DEFINED

---

## Overview

This document defines the canonical 9 CLAUX core agents with their complete specifications including system roles, execution responsibilities, orchestration responsibilities, memory ownership, capabilities, coordination permissions, escalation rules, planning authority, autonomy levels, execution boundaries, governance scope, observability scope, failure semantics, and recovery semantics.

---

## The 9 Canonical CLAUX Agents

### 1. PLANNER

**Canonical Name:** Planner  
**System Role:** Strategic planning and task decomposition  
**Execution Responsibility:** Create and refine execution plans  
**Orchestration Responsibility:** Orchestrate task delegation and coordination  

**Memory Ownership:** working, episodic, semantic, execution, replay  
**Allowed Capabilities:** planning, decomposition, coordination, routing, communication  
**Forbidden Capabilities:** execution, governance, simulation, recovery  
**Coordination Permissions:** delegate, coordinate, escalate, request  
**Escalation Rules:** 
- Escalate to Governor on policy violation
- Escalate to Recoverer on planning failure

**Planning Authority:** STRATEGIC  
**Autonomy Level:** CONSTRAINED  
**Execution Boundaries:** WORKFLOW_BOUNDARY, SESSION_BOUNDARY  
**Governance Scope:** HIERARCHY  
**Observability Scope:** telemetry, tracing, logging, replay  
**Failure Semantic:** FAIL_ESCALATE  
**Recovery Semantic:** ESCALATE_RECOVER

---

### 2. EXECUTOR

**Canonical Name:** Executor  
**System Role:** Task execution and action implementation  
**Execution Responsibility:** Execute tasks and implement actions  
**Orchestration Responsibility:** Report execution status and results  

**Memory Ownership:** working, execution, replay, checkpoint  
**Allowed Capabilities:** execution, validation, communication, coordination  
**Forbidden Capabilities:** planning, governance, routing, simulation  
**Coordination Permissions:** report, request, escalate  
**Escalation Rules:** 
- Escalate to Planner on task ambiguity
- Escalate to Recoverer on execution failure

**Planning Authority:** NONE  
**Autonomy Level:** DIRECTED  
**Execution Boundaries:** TASK_BOUNDARY  
**Governance Scope:** SELF  
**Observability Scope:** telemetry, tracing, logging  
**Failure Semantic:** FAIL_RECOVER  
**Recovery Semantic:** AUTO_RECOVER

---

### 3. VALIDATOR

**Canonical Name:** Validator  
**System Role:** Validation, verification, and quality assurance  
**Execution Responsibility:** Validate outputs and verify correctness  
**Orchestration Responsibility:** Ensure quality standards are met  

**Memory Ownership:** working, episodic, semantic, execution  
**Allowed Capabilities:** validation, analysis, communication, coordination  
**Forbidden Capabilities:** planning, execution, governance, routing  
**Coordination Permissions:** validate, report, escalate  
**Escalation Rules:** 
- Escalate to Governor on validation failure
- Escalate to Planner on quality degradation

**Planning Authority:** NONE  
**Autonomy Level:** SUPERVISED  
**Execution Boundaries:** TASK_BOUNDARY, WORKFLOW_BOUNDARY  
**Governance Scope:** PEER  
**Observability Scope:** telemetry, tracing, logging, replay  
**Failure Semantic:** FAIL_ESCALATE  
**Recovery Semantic:** ESCALATE_RECOVER

---

### 4. GOVERNOR

**Canonical Name:** Governor  
**System Role:** Governance, policy enforcement, and compliance  
**Execution Responsibility:** Enforce policies and ensure compliance  
**Orchestration Responsibility:** Govern system-wide behavior  

**Memory Ownership:** working, semantic, execution, replay  
**Allowed Capabilities:** governance, validation, communication, coordination  
**Forbidden Capabilities:** planning, execution, routing, simulation  
**Coordination Permissions:** govern, approve, reject, escalate  
**Escalation Rules:** Escalate to system administrator on critical violation

**Planning Authority:** NONE  
**Autonomy Level:** CONSTRAINED  
**Execution Boundaries:** SYSTEM_BOUNDARY  
**Governance Scope:** SYSTEM  
**Observability Scope:** telemetry, tracing, logging, audit  
**Failure Semantic:** FAIL_FAST  
**Recovery Semantic:** MANUAL_RECOVER

---

### 5. ANALYZER

**Canonical Name:** Analyzer  
**System Role:** Analysis, pattern detection, and insight generation  
**Execution Responsibility:** Analyze data and generate insights  
**Orchestration Responsibility:** Provide analytical support to other agents  

**Memory Ownership:** working, episodic, semantic  
**Allowed Capabilities:** analysis, validation, communication  
**Forbidden Capabilities:** planning, execution, governance, routing  
**Coordination Permissions:** analyze, report, request  
**Escalation Rules:** Escalate to Planner on critical findings

**Planning Authority:** NONE  
**Autonomy Level:** SUPERVISED  
**Execution Boundaries:** WORKFLOW_BOUNDARY  
**Governance Scope:** SELF  
**Observability Scope:** telemetry, tracing, logging  
**Failure Semantic:** FAIL_SOFT  
**Recovery Semantic:** AUTO_RECOVER

---

### 6. ROUTER

**Canonical Name:** Router  
**System Role:** Routing, dispatch, and resource allocation  
**Execution Responsibility:** Route tasks and allocate resources  
**Orchestration Responsibility:** Optimize resource utilization  

**Memory Ownership:** working, execution, checkpoint  
**Allowed Capabilities:** routing, coordination, communication, optimization  
**Forbidden Capabilities:** planning, execution, governance, validation  
**Coordination Permissions:** route, dispatch, allocate  
**Escalation Rules:** 
- Escalate to Planner on routing conflict
- Escalate to Recoverer on resource exhaustion

**Planning Authority:** OPERATIONAL  
**Autonomy Level:** CONSTRAINED  
**Execution Boundaries:** WORKFLOW_BOUNDARY, SESSION_BOUNDARY  
**Governance Scope:** PEER  
**Observability Scope:** telemetry, tracing, logging  
**Failure Semantic:** FAIL_RECOVER  
**Recovery Semantic:** AUTO_RECOVER

---

### 7. SIMULATOR

**Canonical Name:** Simulator  
**System Role:** Simulation, what-if analysis, and prediction  
**Execution Responsibility:** Simulate scenarios and predict outcomes  
**Orchestration Responsibility:** Support planning with simulation results  

**Memory Ownership:** working, episodic, semantic, replay  
**Allowed Capabilities:** simulation, analysis, communication  
**Forbidden Capabilities:** planning, execution, governance, routing  
**Coordination Permissions:** simulate, report, request  
**Escalation Rules:** Escalate to Planner on critical prediction

**Planning Authority:** TACTICAL  
**Autonomy Level:** SUPERVISED  
**Execution Boundaries:** WORKFLOW_BOUNDARY  
**Governance Scope:** SELF  
**Observability Scope:** telemetry, tracing, logging, replay  
**Failure Semantic:** FAIL_SOFT  
**Recovery Semantic:** AUTO_RECOVER

---

### 8. RECOVERER

**Canonical Name:** Recoverer  
**System Role:** Recovery, fault tolerance, and resilience  
**Execution Responsibility:** Recover from failures and maintain resilience  
**Orchestration Responsibility:** Coordinate recovery across the system  

**Memory Ownership:** working, execution, checkpoint, replay  
**Allowed Capabilities:** recovery, coordination, communication, validation  
**Forbidden Capabilities:** planning, governance, routing  
**Coordination Permissions:** recover, escalate, coordinate  
**Escalation Rules:** Escalate to system administrator on unrecoverable failure

**Planning Authority:** OPERATIONAL  
**Autonomy Level:** CONSTRAINED  
**Execution Boundaries:** SYSTEM_BOUNDARY  
**Governance Scope:** SYSTEM  
**Observability Scope:** telemetry, tracing, logging, diagnostics  
**Failure Semantic:** FAIL_RECOVER  
**Recovery Semantic:** AUTO_RECOVER

---

### 9. OBSERVER

**Canonical Name:** Observer  
**System Role:** Observability, monitoring, and diagnostics  
**Execution Responsibility:** Monitor system state and collect diagnostics  
**Orchestration Responsibility:** Provide observability for the entire system  

**Memory Ownership:** working, execution, replay, checkpoint  
**Allowed Capabilities:** observability, communication, analysis  
**Forbidden Capabilities:** planning, execution, governance, routing  
**Coordination Permissions:** observe, report, alert  
**Escalation Rules:** 
- Escalate to Governor on critical anomaly
- Escalate to Recoverer on system degradation

**Planning Authority:** NONE  
**Autonomy Level:** FULL  
**Execution Boundaries:** SYSTEM_BOUNDARY  
**Governance Scope:** SYSTEM  
**Observability Scope:** telemetry, tracing, logging, diagnostics, health, replay, runtime_inspection  
**Failure Semantic:** FAIL_SOFT  
**Recovery Semantic:** AUTO_RECOVER

---

## Architecture Summary

**Total Agents:** 9  
**Total Files Defined:** 30+ TypeScript type definition files  
**Modules:** system, topology, memory, capabilities, runtime, governance, coordination, planning, registry

All agents follow strict architectural rules:
- Strict typing with readonly properties
- Immutable state where required
- Pure semantic logic
- Framework agnostic
- Deterministic and replay-safe

---

## Conclusion

The CLAUX Canonical Agent Architecture is formally defined with complete specifications for all 9 core agents. This architecture serves as the semantic brain of the CLAUX platform and provides the foundation for workflow composition, runtime orchestration, planner execution, memory routing, governance, observability, and future product APIs.

**Overall Status:** DEFINED
