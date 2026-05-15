# AGENT COMMUNICATION PROTOCOL

**Module:** CLAUX Agent Communication Protocol  
**Date:** 2026-05-10  
**Status:** DEFINED

---

## Overview

This document defines the agent communication protocol including inter-agent messaging, event propagation, command semantics, request/response semantics, streaming semantics, coordination events, arbitration events, recovery events, escalation events, causality preservation, trace propagation, and distributed coordination semantics.

---

## Message Types

### COMMAND
- Command messages for direct execution
- Requires response if specified
- Used for delegation and coordination

### REQUEST
- Request messages for information or action
- Includes timeout for response
- Used for queries and data requests

### RESPONSE
- Response messages to requests
- Includes status (success/failure/error)
- Includes response data

### EVENT
- Event messages for notification
- No response required
- Used for state changes and notifications

### STREAM
- Stream messages for continuous data
- Includes sequence number
- End-of-stream marker

### NOTIFICATION
- Notification messages for alerts
- No response required
- Used for warnings and alerts

---

## Event Types

### COORDINATION
- Coordination events for multi-agent coordination

### ARBITRATION
- Arbitration events for conflict resolution

### RECOVERY
- Recovery events for failure recovery

### ESCALATION
- Escalation events for escalation chains

### STATE_CHANGE
- State change events for agent state transitions

### ERROR
- Error events for error reporting

---

## Delivery Modes

### SYNCHRONOUS
- Synchronous delivery with blocking

### ASYNCHRONOUS
- Asynchronous delivery without blocking (default)

### FIRE_AND_FORGET
- Fire and forget without confirmation

---

## Causality Mode

### CAUSAL
- Causal causality preservation (default)
- Maintains causal ordering across messages

### STRICT
- Strict causality with total ordering

### EVENTUAL
- Eventual causality for relaxed ordering

### NONE
- No causality guarantees

---

## Trace Propagation

All messages include:
- **Causality ID:** For causal tracking
- **Trace ID:** For distributed tracing

Trace propagation is enabled by default.

---

## Canonical Communication Protocol

**Protocol ID:** claux_canonical_protocol_v1

**Supported Message Types:** COMMAND, REQUEST, RESPONSE, EVENT, STREAM, NOTIFICATION

**Supported Event Types:** COORDINATION, ARBITRATION, RECOVERY, ESCALATION, STATE_CHANGE, ERROR

**Default Delivery Mode:** ASYNCHRONOUS

**Causality Mode:** CAUSAL

**Trace Propagation:** Enabled

---

## Communication Patterns

### Delegation Pattern
- PLANNER → EXECUTOR (COMMAND)
- PLANNER → ROUTER (COMMAND)
- PLANNER → SIMULATOR (COMMAND)

### Reporting Pattern
- EXECUTOR → PLANNER (RESPONSE)
- VALIDATOR → GOVERNOR (RESPONSE)
- OBSERVER → GOVERNOR (EVENT)

### Escalation Pattern
- EXECUTOR → PLANNER → GOVERNOR (ESCALATION)
- OBSERVER → GOVERNOR (ESCALATION)
- OBSERVER → RECOVERER (ESCALATION)

### Coordination Pattern
- PLANNER ↔ ROUTER (COORDINATION)
- OBSERVER → All Agents (STATE_CHANGE)

---

## Conclusion

The CLAUX Agent Communication Protocol provides a comprehensive messaging framework with causality preservation, trace propagation, and support for multiple message types and delivery modes. The protocol enables deterministic multi-agent coordination.

**Overall Status:** DEFINED
