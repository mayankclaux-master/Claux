/**
 * Runtime Event Constants
 * 
 * Canonical event names for CLAUX runtime
 * All runtime events MUST use these constants ONLY
 */

export const RuntimeEvents = {
  // Execution events
  EXECUTION_CREATED: 'execution.created',
  EXECUTION_STARTED: 'execution.started',
  EXECUTION_COMPLETED: 'execution.completed',
  EXECUTION_FAILED: 'execution.failed',
  EXECUTION_CANCELLED: 'execution.cancelled',
  EXECUTION_RESUMED: 'execution.resumed',
  EXECUTION_RETRIED: 'execution.retried',
  EXECUTION_RECOVERED: 'execution.recovered',

  // Task events
  TASK_CREATED: 'task.created',
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  TASK_SKIPPED: 'task.skipped',
  TASK_RETRIED: 'task.retried',

  // Provider events
  PROVIDER_DISPATCHED: 'provider.dispatched',
  PROVIDER_DISPATCH_FAILED: 'provider.dispatch_failed',
  PROVIDER_CALLBACK_RECEIVED: 'provider.callback_received',
  PROVIDER_CALLBACK_FAILED: 'provider.callback_failed',
  PROVIDER_QUARANTINED: 'provider.quarantined',
  PROVIDER_RESTORED: 'provider.restored',
  PROVIDER_RESPONSE_RECEIVED: 'provider.response_received',
  PROVIDER_RESPONSE_FAILED: 'provider.response_failed',

  // Connector events
  CONNECTOR_EXECUTION_STARTED: 'connector.execution_started',
  CONNECTOR_EXECUTION_COMPLETED: 'connector.execution_completed',
  CONNECTOR_EXECUTION_FAILED: 'connector.execution_failed',
  CONNECTOR_REQUEST_SENT: 'connector.request_sent',
  CONNECTOR_REQUEST_FAILED: 'connector.request_failed',
  CONNECTOR_RESPONSE_RECEIVED: 'connector.response_received',
  CONNECTOR_RESPONSE_FAILED: 'connector.response_failed',

  // Retry events
  RETRY_TRIGGERED: 'retry.triggered',
  RETRY_FAILED: 'retry.failed',
  RETRY_EXHAUSTED: 'retry.exhausted',

  // Recovery events
  RECOVERY_STARTED: 'recovery.started',
  RECOVERY_COMPLETED: 'recovery.completed',
  RECOVERY_FAILED: 'recovery.failed',
  RECOVERY_SKIPPED: 'recovery.skipped',

  // Publish events
  PUBLISH_STARTED: 'publish.started',
  PUBLISH_COMPLETED: 'publish.completed',
  PUBLISH_FAILED: 'publish.failed',
  PUBLISH_ROLLBACK_STARTED: 'publish.rollback_started',
  PUBLISH_ROLLBACK_COMPLETED: 'publish.rollback_completed',
  PUBLISH_ROLLBACK_FAILED: 'publish.rollback_failed',

  // Rollback events
  ROLLBACK_TRIGGERED: 'rollback.triggered',
  ROLLBACK_COMPLETED: 'rollback.completed',
  ROLLBACK_FAILED: 'rollback.failed',

  // Governance events
  GOVERNANCE_CHECK_FAILED: 'governance.check_failed',
  GOVERNANCE_APPROVAL_REQUIRED: 'governance.approval_required',
  GOVERNANCE_APPROVAL_GRANTED: 'governance.approval_granted',
  GOVERNANCE_APPROVAL_DENIED: 'governance.approval_denied',

  // Observability events
  OBSERVABILITY_METRIC: 'observability.metric',
  OBSERVABILITY_HEALTH_CHECK: 'observability.health_check',
  OBSERVABILITY_ALERT: 'observability.alert',

  // Orchestrator events
  ORCHESTRATOR_LIFECYCLE_INITIALIZED: 'orchestrator.lifecycle_initialized',
  ORCHESTRATOR_STATE_RECONCILED: 'orchestrator.state_reconciled',
  ORCHESTRATOR_HEALTH_CHECKED: 'orchestrator.health_checked',
  ORCHESTRATOR_STALLED_DETECTED: 'orchestrator.stalled_detected',
  ORCHESTRATOR_FAILED_DETECTED: 'orchestrator.failed_detected',
} as const;

export type RuntimeEventName = typeof RuntimeEvents[keyof typeof RuntimeEvents];
