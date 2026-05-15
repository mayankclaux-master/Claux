/**
 * Inngest Client Configuration
 * Central Inngest client setup for CLAUX workflows
 */

import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'claux',
  name: 'CLAUX Agent Runtime',
});

/**
 * Inngest event names
 * These must match the event names in the event system
 */
export const InngestEvents = {
  // LOCL events
  LOCL_AUDIT_COMPLETED: 'locl/audit.completed',
  LOCL_AUDIT_FAILED: 'locl/audit.failed',

  // ARIA events
  ARIA_CONTENT_GENERATED: 'aria/content.generated',
  ARIA_CONTENT_FAILED: 'aria/content.failed',

  // PUBLISH events
  PUBLISH_COMPLETED: 'publish/completed',
  PUBLISH_FAILED: 'publish/failed',

  // PULSE events
  PULSE_RANKINGS_UPDATED: 'pulse/rankings.updated',

  // Workflow events
  WORKFLOW_STARTED: 'workflow/started',
  WORKFLOW_COMPLETED: 'workflow/completed',
  WORKFLOW_FAILED: 'workflow/failed',
} as const;

/**
 * Convert CLAUX event names to Inngest format
 * CLAUX uses dot notation (locl.audit.completed)
 * Inngest uses slash notation (locl/audit.completed)
 */
export function toInngestEventName(clauxEventName: string): string {
  return clauxEventName.replace(/\./g, '/');
}

/**
 * Convert Inngest event names to CLAUX format
 */
export function toClauxEventName(inngestEventName: string): string {
  return inngestEventName.replace(/\//g, '.');
}
