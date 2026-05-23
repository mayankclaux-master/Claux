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
 * GMB Audit Task
 * Audits Google My Business profile and generates optimization recommendations
 * CLAUX V1: GMB intelligence only, NO direct GMB modification
 */
export class GmbAuditTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId, input } = context;
    const businessName = input.business_name as string;
    const location = input.location as string;
    
    // Mock GMB data (would integrate with Google Business Profile API in production)
    const gmbProfile = {
      business_name: businessName || 'Sample Business',
      location: location || 'New York, NY',
      review_count: 45,
      average_rating: 4.2,
      photos_count: 15,
      posts_count: 3,
      categories: ['Business Services'],
    };
    
    const gmbRecommendations = this.generateGmbRecommendations(gmbProfile);
    const citationOpportunities = this.generateCitationOpportunities(businessName);
    const localVisibilityScore = this.calculateLocalVisibilityScore(gmbProfile);
    
    return {
      taskId,
      status: TaskStatus.COMPLETED,
      output: {
        gmb_profile: gmbProfile,
        gmb_recommendations: gmbRecommendations,
        citation_opportunities: citationOpportunities,
        local_visibility_score: localVisibilityScore,
        total_locations: 1,
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
    if (!input.business_name) errors.push('business_name is required');
    if (!input.location) errors.push('location is required');
    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  private generateGmbRecommendations(profile: {
    review_count: number;
    average_rating: number;
    photos_count: number;
    posts_count: number;
  }): Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }> {
    const recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      action: string;
      impact: string;
    }> = [];

    if (profile.review_count < 50) {
      recommendations.push({
        title: 'Increase review count',
        description: `Current review count is ${profile.review_count}. Target is 50+ reviews for better local ranking.`,
        priority: 'high',
        action: 'Request reviews from recent customers via email or in-person',
        impact: 'Higher review count improves local pack visibility and trust',
      });
    }

    if (profile.photos_count < 20) {
      recommendations.push({
        title: 'Add more business photos',
        description: `Current photo count is ${profile.photos_count}. Target is 20+ photos.`,
        priority: 'medium',
        action: 'Upload high-quality photos of business, team, products, and services',
        impact: 'More photos increase engagement and profile completeness',
      });
    }

    if (profile.posts_count < 5) {
      recommendations.push({
        title: 'Publish GMB posts',
        description: `Current post count is ${profile.posts_count}. Target is 5+ recent posts.`,
        priority: 'medium',
        action: 'Publish weekly updates, offers, and news to GMB profile',
        impact: 'Regular posts improve engagement and local ranking signals',
      });
    }

    if (profile.average_rating < 4.5) {
      recommendations.push({
        title: 'Improve average rating',
        description: `Current rating is ${profile.average_rating}. Target is 4.5+ stars.`,
        priority: 'high',
        action: 'Address negative reviews promptly and encourage satisfied customers to leave reviews',
        impact: 'Higher rating improves click-through rate and local ranking',
      });
    }

    return recommendations;
  }

  private generateCitationOpportunities(businessName: string): Array<{
    source: string;
    url: string;
    status: 'missing' | 'inconsistent' | 'verified';
  }> {
    return [
      {
        source: 'Yelp',
        url: 'https://yelp.com',
        status: 'missing',
      },
      {
        source: 'Yellow Pages',
        url: 'https://yellowpages.com',
        status: 'missing',
      },
      {
        source: 'Foursquare',
        url: 'https://foursquare.com',
        status: 'missing',
      },
      {
        source: 'TripAdvisor',
        url: 'https://tripadvisor.com',
        status: 'missing',
      },
    ];
  }

  private calculateLocalVisibilityScore(profile: {
    review_count: number;
    average_rating: number;
    photos_count: number;
    posts_count: number;
  }): number {
    let score = 0;

    // Rating: max 30 points
    const ratingScore = Math.min(30, (profile.average_rating / 5) * 30);
    score += ratingScore;

    // Reviews: max 30 points
    const reviewScore = Math.min(30, (profile.review_count / 100) * 30);
    score += reviewScore;

    // Photos: max 20 points
    const photoScore = Math.min(20, (profile.photos_count / 30) * 20);
    score += photoScore;

    // Posts: max 20 points
    const postScore = Math.min(20, (profile.posts_count / 10) * 20);
    score += postScore;

    return Math.round(score);
  }
}

/**
 * Locl Task Executor Factory
 * Creates task executors for LOCL agent
 * CLAUX V1: Local SEO intelligence only
 */
export class LoclTaskExecutorFactory {
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
      case 'task_gmb_audit':
        return new GmbAuditTask();

      default:
        console.error(`Unknown task type: ${taskType}`);
        return null;
    }
  }

  getSupportedTaskTypes(): string[] {
    return [
      'task_gmb_audit',
    ];
  }
}
