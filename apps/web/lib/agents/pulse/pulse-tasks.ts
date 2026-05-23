import type {
  RuntimeTaskExecutor,
  TaskExecutionContext,
  TaskExecutionResult,
  TaskCheckpoint,
  ValidationResult,
} from '@/lib/runtime/contracts/task.contract';
import { TaskStatus } from '@/lib/runtime/contracts/task.contract';
import type { UUID } from '@/lib/runtime/types/common.types';

/**
 * Ranking Check Task
 * Checks keyword rankings and detects movement
 * CLAUX V1: Ranking intelligence only, no autonomous execution
 */
export class RankingCheckTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId, input } = context;
    const keywords = input.keywords as string[];
    const location = input.location as string;
    const device = input.device as string;
    
    // Mock ranking data (would integrate with DataForSEO/SerpAPI in production)
    const rankingChanges = [
      {
        keyword: 'seo services',
        current_position: 8,
        previous_position: 5,
        change: -3,
        search_volume: 1200,
        url: 'https://example.com/seo-services',
      },
      {
        keyword: 'digital marketing',
        current_position: 12,
        previous_position: 15,
        change: 3,
        search_volume: 5400,
        url: 'https://example.com/digital-marketing',
      },
      {
        keyword: 'content marketing',
        current_position: 3,
        previous_position: 8,
        change: 5,
        search_volume: 890,
        url: 'https://example.com/content-marketing',
      },
    ];
    
    const visibilityScore = this.calculateVisibilityScore(rankingChanges);
    const rankingMovement = this.calculateRankingMovement(rankingChanges);
    
    return {
      taskId,
      status: TaskStatus.COMPLETED,
      output: {
        ranking_changes: rankingChanges,
        visibility_score: visibilityScore,
        ranking_movement: rankingMovement,
        total_keywords_checked: keywords.length || 3,
        location,
        device,
      },
      metrics: {
        durationMs: 0,
        cost: 0,
        tokens: 0,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.keywords) errors.push('keywords is required');
    if (!input.location) errors.push('location is required');
    if (!input.device) errors.push('device is required');
    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  private calculateVisibilityScore(rankingChanges: Array<{current_position: number}>): number {
    if (rankingChanges.length === 0) return 0;
    const totalVisibility = rankingChanges.reduce((sum, change) => sum + (101 - change.current_position), 0);
    return Math.round(totalVisibility / rankingChanges.length);
  }

  private calculateRankingMovement(rankingChanges: Array<{change: number}>): {
    gains: number;
    losses: number;
    net_change: number;
  } {
    const gains = rankingChanges.filter(c => c.change > 0).length;
    const losses = rankingChanges.filter(c => c.change < 0).length;
    const netChange = rankingChanges.reduce((sum, c) => sum + c.change, 0);
    return {
      gains,
      losses,
      net_change: netChange,
    };
  }
}

/**
 * Pulse Task Executor Factory
 * Creates task executors for PULSE agent
 * CLAUX V1: Ranking intelligence only
 */
export class PulseTaskExecutorFactory {
  private tenantId: UUID;
  private executionId: UUID;
  private taskId: UUID;

  constructor(
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID
  ) {
    this.tenantId = tenantId;
    this.executionId = executionId;
    this.taskId = taskId;
  }

  createExecutor(taskType: string): RuntimeTaskExecutor | null {
    switch (taskType) {
      case 'task_ranking_check':
        return new RankingCheckTask();

      default:
        console.error(`Unknown task type: ${taskType}`);
        return null;
    }
  }

  getSupportedTaskTypes(): string[] {
    return [
      'task_ranking_check',
    ];
  }
}
