/**
 * CLAUX Phase 2B — Command Centre Types
 * Canonical types for human execution task system
 */

// ============================================================
// Task Priority
// ============================================================
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

// ============================================================
// Task Status
// ============================================================
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';

// ============================================================
// Task Type
// ============================================================
export type TaskType =
  // Publishing tasks
  | 'publishing_package'
  | 'content_review'
  | 'schema_implementation'
  | 'internal_linking'
  // Technical SEO tasks
  | 'technical_audit'
  | 'cwv_optimization'
  | 'schema_validation'
  | 'redirect_fix'
  // Local SEO tasks
  | 'gmb_optimization'
  | 'citation_building'
  | 'local_audit'
  // Link building tasks
  | 'backlink_outreach'
  | 'competitor_analysis'
  | 'authority_building'
  // Review tasks
  | 'review_reply'
  | 'sentiment_analysis'
  // Indexing tasks
  | 'url_indexing'
  | 'sitemap_update'
  // General tasks
  | 'keyword_review'
  | 'content_audit'
  | 'competitor_gap_analysis';

// ============================================================
// Action Type
// ============================================================
export type ActionType =
  | 'created'
  | 'assigned'
  | 'started'
  | 'completed'
  | 'blocked'
  | 'cancelled'
  | 'reassigned'
  | 'updated'
  | 'commented';

// ============================================================
// Command Center Task
// ============================================================
export interface CommandCenterTask {
  id: string;
  tenant_id: string;
  client_id?: string;
  agent_name: string;
  task_type: TaskType;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  source_execution_id?: string;
  source_task_id?: string;
  metadata: Record<string, unknown>;
  action_payload: Record<string, unknown>;
  assigned_to?: string;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Command Center Task Insert
// ============================================================
export interface CommandCenterTaskInsert {
  tenant_id: string;
  client_id?: string;
  agent_name: string;
  task_type: TaskType;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  source_execution_id?: string;
  source_task_id?: string;
  metadata?: Record<string, unknown>;
  action_payload?: Record<string, unknown>;
  assigned_to?: string;
  due_at?: string;
}

// ============================================================
// Command Center Task Update
// ============================================================
export interface CommandCenterTaskUpdate {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string;
  due_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  action_payload?: Record<string, unknown>;
}

// ============================================================
// Task Activity Log
// ============================================================
export interface TaskActivityLog {
  id: string;
  tenant_id: string;
  task_id: string;
  action_type: ActionType;
  actor_id?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Task Activity Log Insert
// ============================================================
export interface TaskActivityLogInsert {
  tenant_id: string;
  task_id: string;
  action_type: ActionType;
  actor_id?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Keyword Universe Entry
// ============================================================
export interface KeywordUniverseEntry {
  id: string;
  tenant_id: string;
  client_id?: string;
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  opportunity_score: number;
  ranking_position?: number;
  ranking_url?: string;
  search_intent?: string;
  source_agent?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Keyword Universe Entry Insert
// ============================================================
export interface KeywordUniverseEntryInsert {
  tenant_id: string;
  client_id?: string;
  keyword: string;
  search_volume?: number;
  keyword_difficulty?: number;
  opportunity_score?: number;
  ranking_position?: number;
  ranking_url?: string;
  search_intent?: string;
  source_agent?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Keyword Universe Entry Update
// ============================================================
export interface KeywordUniverseEntryUpdate {
  search_volume?: number;
  keyword_difficulty?: number;
  opportunity_score?: number;
  ranking_position?: number;
  ranking_url?: string;
  search_intent?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Agent Task Generation Payload
// ============================================================
export interface AgentTaskGenerationPayload {
  tenant_id: string;
  client_id?: string;
  agent_name: string;
  source_execution_id?: string;
  source_task_id?: string;
  tasks: Array<{
    task_type: TaskType;
    title: string;
    description?: string;
    priority?: TaskPriority;
    action_payload?: Record<string, unknown>;
    due_at?: string;
  }>;
}

// ============================================================
// Task Filters
// ============================================================
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  agent_name?: string;
  task_type?: TaskType;
  assigned_to?: string;
  client_id?: string;
  due_before?: string;
  due_after?: string;
}

// ============================================================
// Task Query Result
// ============================================================
export interface TaskQueryResult {
  tasks: CommandCenterTask[];
  total: number;
  page: number;
  page_size: number;
}

// ============================================================
// Activity Feed Event
// ============================================================
export interface ActivityFeedEvent {
  id: string;
  type: 'task_created' | 'task_completed' | 'agent_execution' | 'keyword_updated';
  tenant_id: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
