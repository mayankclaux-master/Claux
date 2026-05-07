export type AgentName =
  | 'ARIA'
  | 'SCRIBE'
  | 'PUBLISH'
  | 'PULSE'
  | 'LOCL'
  | 'LINX'
  | 'CORE'
  | 'REPUTE'
  | 'AMPLI'
  | 'PRISM';

export interface AgentContext {
  tenantId: string;
  agent: AgentName;
  runId: string;
}
