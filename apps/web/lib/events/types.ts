/**
 * Event Type Definitions
 * Strongly typed event schemas for the CLAUX event system
 * 
 * RESTRICTED TAXONOMY (Sprint 1):
 * Only 5 core events allowed until runtime is fully tested:
 * - agent.started
 * - agent.completed
 * - agent.failed
 * - workflow.started
 * - workflow.completed
 */

// Base event interface
export interface BaseEvent {
  id: string;
  tenant_id: string;
  event_name: string;
  event_source: string;
  event_version: string;
  correlation_id?: string;
  causation_id?: string;
  created_at: Date;
}

// Agent Events
export interface AgentStartedEvent extends BaseEvent {
  event_name: 'agent.started';
  event_source: string; // Any agent name (LOCL, ARIA, etc.)
  payload: {
    agent_name: string;
    execution_id: string;
    tenant_id: string;
  };
}

export interface AgentCompletedEvent extends BaseEvent {
  event_name: 'agent.completed';
  event_source: string; // Any agent name
  payload: {
    agent_name: string;
    execution_id: string;
    tenant_id: string;
    total_cost: number;
    total_tokens: number;
  };
}

export interface AgentFailedEvent extends BaseEvent {
  event_name: 'agent.failed';
  event_source: string; // Any agent name
  payload: {
    agent_name: string;
    execution_id: string;
    error_message: string;
    tenant_id: string;
  };
}

// Workflow Events
export interface WorkflowStartedEvent extends BaseEvent {
  event_name: 'workflow.started';
  event_source: 'system';
  payload: {
    workflow_type: string;
    execution_id: string;
    agent_name: string;
    tenant_id: string;
  };
}

export interface WorkflowCompletedEvent extends BaseEvent {
  event_name: 'workflow.completed';
  event_source: 'system';
  payload: {
    workflow_type: string;
    execution_id: string;
    agent_name: string;
    tenant_id: string;
    total_cost: number;
    total_tokens: number;
  };
}

// Union type of all events (RESTRICTED to 5 core events)
export type ClauxEvent =
  | AgentStartedEvent
  | AgentCompletedEvent
  | AgentFailedEvent
  | WorkflowStartedEvent
  | WorkflowCompletedEvent;

// Event name to type mapping
export type EventName = ClauxEvent['event_name'];

// Event handler type
export type EventHandler<T extends ClauxEvent> = (event: T) => Promise<void>;

// Event listener configuration
export interface EventListenerConfig<T extends ClauxEvent> {
  eventName: T['event_name'];
  handler: EventHandler<T>;
  filter?: (event: T) => boolean;
}

// Event emitter configuration
export interface EventEmitterConfig {
  tenant_id: string;
  event_source: string;
  correlation_id?: string;
  causation_id?: string;
}
