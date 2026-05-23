/**
 * Tenant Activation Service
 * 
 * Canonical onboarding orchestrator for CLAUX V1.
 * Single canonical onboarding pipeline: tenant activation → connector readiness → domain verification → keyword bootstrap → execution bootstrap → dashboard activation → command centre activation → production ready.
 * 
 * CRITICAL: This is the ONLY onboarding orchestrator in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { CronExecutionService } from '../execution/cron-execution.service';
import { connectorHealthService } from '../oauth/connector-health.service';
import { connectorAuthValidator } from '../oauth/connector-auth-validator';

/**
 * Onboarding status
 */
export type OnboardingStatus =
  | 'account_created'
  | 'connectors_pending'
  | 'domain_verification'
  | 'keyword_bootstrap'
  | 'execution_bootstrap'
  | 'dashboard_activation'
  | 'command_center_activation'
  | 'production_ready'
  | 'failed';

/**
 * Onboarding session
 */
export interface OnboardingSession {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  traceId?: UUID;
  status: OnboardingStatus;
  retryCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/**
 * Tenant activation config
 */
export interface TenantActivationConfig {
  tenantId: UUID;
  userId: UUID;
  websiteUrl: string;
  businessName: string;
  category: string;
  traceId?: UUID;
}

/**
 * Tenant activation result
 */
export interface TenantActivationResult {
  success: boolean;
  sessionId: UUID;
  status: OnboardingStatus;
  stagesCompleted: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Tenant activation service
 */
export class TenantActivationService {
  private logger: Logger;
  private cronExecutionService: CronExecutionService;

  constructor() {
    this.logger = createLogger();
    this.cronExecutionService = new CronExecutionService();
  }

  /**
   * Initialize tenant onboarding session
   */
  async initializeOnboardingSession(
    tenantId: UUID,
    userId: UUID,
    traceId?: UUID
  ): Promise<OnboardingSession> {
    this.logger.info('Initializing onboarding session', { tenantId, userId, traceId });

    const supabase = createClerkSupabaseClient('');

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .upsert({
        tenant_id: tenantId,
        user_id: userId,
        trace_id: traceId,
        status: 'account_created',
        retry_count: 0,
        metadata: {},
      }, {
        onConflict: 'tenant_id',
      })
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to initialize onboarding session', { error, tenantId });
      throw new Error(`Failed to initialize onboarding session: ${error.message}`);
    }

    const session: OnboardingSession = {
      id: data.id,
      tenantId: data.tenant_id,
      userId: data.user_id,
      traceId: data.trace_id,
      status: data.status as OnboardingStatus,
      retryCount: data.retry_count,
      metadata: data.metadata as Record<string, unknown>,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };

    this.logger.info('Onboarding session initialized', { tenantId, sessionId: session.id });
    return session;
  }

  /**
   * Activate tenant (full onboarding pipeline)
   */
  async activateTenant(config: TenantActivationConfig, token: string): Promise<TenantActivationResult> {
    this.logger.info('Starting tenant activation', { tenantId: config.tenantId });

    const stagesCompleted: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    const traceId = config.traceId || (crypto.randomUUID() as UUID);

    try {
      // Initialize onboarding session
      const session = await this.initializeOnboardingSession(config.tenantId, config.userId, traceId);
      stagesCompleted.push('account_created');

      // Initialize default schedules
      await this.initializeDefaultSchedules(config.tenantId, token);
      stagesCompleted.push('schedules_initialized');

      // Initialize connector configs
      await this.initializeConnectorConfigs(config.tenantId, token);
      stagesCompleted.push('connector_configs_initialized');

      // Initialize dashboard state
      await this.initializeDashboardState(config.tenantId, token);
      stagesCompleted.push('dashboard_state_initialized');

      // Initialize command centre state
      await this.initializeCommandCentreState(config.tenantId, token);
      stagesCompleted.push('command_center_state_initialized');

      // Update session status
      await this.updateSessionStatus(session.id, 'connectors_pending', token);

      return {
        success: true,
        sessionId: session.id,
        status: 'connectors_pending',
        stagesCompleted,
        errors,
        warnings,
      };
    } catch (error) {
      this.logger.error('Tenant activation failed', { tenantId: config.tenantId, error });
      errors.push(error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        sessionId: crypto.randomUUID() as UUID,
        status: 'failed',
        stagesCompleted,
        errors,
        warnings,
      };
    }
  }

  /**
   * Initialize default schedules
   */
  private async initializeDefaultSchedules(tenantId: UUID, token: string): Promise<void> {
    this.logger.info('Initializing default schedules', { tenantId });

    const agents = ['ARIA', 'PULSE', 'CORE', 'LINX', 'PRISM', 'LOCL', 'REPUTE', 'SCRIBE', 'PUBLISH'];

    for (const agent of agents) {
      try {
        await this.cronExecutionService.createSchedule(
          tenantId,
          agent,
          'cron',
          '0 0 * * *', // Daily at midnight
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Next run at midnight tomorrow
          token,
          {
            executionTimeoutMs: 30000,
            retryLimit: 3,
          }
        );
      } catch (error) {
        this.logger.warn(`Failed to create schedule for ${agent}`, { tenantId, error });
      }
    }

    this.logger.info('Default schedules initialized', { tenantId });
  }

  /**
   * Initialize connector configs
   */
  private async initializeConnectorConfigs(tenantId: UUID, token: string): Promise<void> {
    this.logger.info('Initializing connector configs', { tenantId });

    // Connector configs are initialized via OAuth flow
    // This is a placeholder for any additional config initialization

    this.logger.info('Connector configs initialized', { tenantId });
  }

  /**
   * Initialize dashboard state
   */
  private async initializeDashboardState(tenantId: UUID, token: string): Promise<void> {
    this.logger.info('Initializing dashboard state', { tenantId });

    // Dashboard state is initialized via execution persistence
    // This is a placeholder for any additional dashboard initialization

    this.logger.info('Dashboard state initialized', { tenantId });
  }

  /**
   * Initialize command centre state
   */
  private async initializeCommandCentreState(tenantId: UUID, token: string): Promise<void> {
    this.logger.info('Initializing command centre state', { tenantId });

    // Command centre state is initialized via task generation
    // This is a placeholder for any additional command centre initialization

    this.logger.info('Command centre state initialized', { tenantId });
  }

  /**
   * Update session status
   */
  private async updateSessionStatus(sessionId: UUID, status: OnboardingStatus, token: string): Promise<void> {
    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('onboarding_sessions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      this.logger.error('Failed to update session status', { error, sessionId });
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  }

  /**
   * Get onboarding session
   */
  async getOnboardingSession(tenantId: UUID, token: string): Promise<OnboardingSession | null> {
    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to get onboarding session', { error, tenantId });
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      tenantId: data.tenant_id,
      userId: data.user_id,
      traceId: data.trace_id,
      status: data.status as OnboardingStatus,
      retryCount: data.retry_count,
      metadata: data.metadata as Record<string, unknown>,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  }

  /**
   * Validate connector readiness
   */
  async validateConnectorReadiness(tenantId: UUID, token: string): Promise<{
    healthy: boolean;
    connectors: Record<string, boolean>;
  }> {
    this.logger.info('Validating connector readiness', { tenantId });

    const providers = ['google_analytics', 'google_search_console', 'google_business_profile'];
    const connectors: Record<string, boolean> = {};

    for (const provider of providers) {
      try {
        const validation = await connectorAuthValidator.validateCredentials(tenantId, provider, token);
        connectors[provider] = validation.valid;
      } catch (error) {
        connectors[provider] = false;
      }
    }

    const healthy = Object.values(connectors).every((v) => v === true);

    this.logger.info('Connector readiness validated', { tenantId, healthy, connectors });
    return { healthy, connectors };
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(sessionId: UUID, token: string): Promise<void> {
    this.logger.info('Completing onboarding', { sessionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase
      .from('onboarding_sessions')
      .update({
        status: 'production_ready',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      this.logger.error('Failed to complete onboarding', { error, sessionId });
      throw new Error(`Failed to complete onboarding: ${error.message}`);
    }

    this.logger.info('Onboarding completed', { sessionId });
  }
}

/**
 * Singleton instance
 */
export const tenantActivationService = new TenantActivationService();
