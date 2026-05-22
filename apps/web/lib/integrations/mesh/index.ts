/**
 * Integration Mesh - Canonical Integration Layer
 * 
 * This is the canonical integration mesh for CLAUX.
 * All provider execution MUST flow through this layer.
 * 
 * Canonical Flow:
 * Agent → RuntimeService → ExecutionOrchestrator → Integration Adapter → Integration Dispatcher → n8n Webhook → External Provider → Callback/Webhook → Runtime Event → Task Completion
 * 
 * NO direct provider calls allowed in agents.
 * NO alternate execution flows allowed.
 */

export * from './callbacks';
export * from './webhooks';
export * from './providers';
export * from './validation';
