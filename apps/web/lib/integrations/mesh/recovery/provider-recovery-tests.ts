import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { RecoveryValidation } from './recovery-validation';
import { LogLevel } from '@/lib/runtime/types/log.types';

export interface ProviderRecoveryTestResult {
  provider: string;
  testType: string;
  success: boolean;
  executionId: string;
  tenantId: string;
  error?: string;
  duration: number;
}

export class ProviderRecoveryTests {
  private runtime: RuntimeService;
  private validation: RecoveryValidation;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.runtime = new RuntimeService({ tenantId, logOperations: true, enableMetrics: true });
    this.validation = new RecoveryValidation(this.runtime);
  }

  async testDataForSEOTimeoutRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-dataforseo-timeout-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'provider_timeout',
        event_source: 'recovery_test',
        payload: { provider: 'dataforseo', testType: 'timeout_recovery' },
      });

      const recoveryAction = await this.validation.validateProviderTimeoutRecovery(executionId, 'dataforseo');

      if (recoveryAction.recoveryAction === 'retry') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'DataForSEO timeout recovery validated',
          context: { provider: 'dataforseo', testType: 'timeout_recovery', recoveryAction },
        });

        return {
          provider: 'dataforseo',
          testType: 'timeout_recovery',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'DataForSEO timeout recovery test failed', {
        provider: 'dataforseo',
        testType: 'timeout_recovery',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'dataforseo',
        testType: 'timeout_recovery',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testGSCTimeoutRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-gsc-timeout-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'provider_timeout',
        event_source: 'recovery_test',
        payload: { provider: 'gsc', testType: 'timeout_recovery' },
      });

      const recoveryAction = await this.validation.validateProviderTimeoutRecovery(executionId, 'gsc');

      if (recoveryAction.recoveryAction === 'retry') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'GSC timeout recovery validated',
          context: { provider: 'gsc', testType: 'timeout_recovery', recoveryAction },
        });

        return {
          provider: 'gsc',
          testType: 'timeout_recovery',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'GSC timeout recovery test failed', {
        provider: 'gsc',
        testType: 'timeout_recovery',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'gsc',
        testType: 'timeout_recovery',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testGBPTImeoutRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-gbp-timeout-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'provider_timeout',
        event_source: 'recovery_test',
        payload: { provider: 'gbp', testType: 'timeout_recovery' },
      });

      const recoveryAction = await this.validation.validateProviderTimeoutRecovery(executionId, 'gbp');

      if (recoveryAction.recoveryAction === 'retry') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'GBP timeout recovery validated',
          context: { provider: 'gbp', testType: 'timeout_recovery', recoveryAction },
        });

        return {
          provider: 'gbp',
          testType: 'timeout_recovery',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'GBP timeout recovery test failed', {
        provider: 'gbp',
        testType: 'timeout_recovery',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'gbp',
        testType: 'timeout_recovery',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testCallbackReplayRecovery(provider: string): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-callback-replay-${provider}-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'callback_replay',
        event_source: 'recovery_test',
        payload: { provider, testType: 'callback_replay' },
      });

      const recoveryAction = await this.validation.validateCallbackReplayRecovery(executionId, `callback-${Date.now()}`);

      if (recoveryAction.recoveryAction === 'continue') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'Callback replay recovery validated',
          context: { provider, testType: 'callback_replay', recoveryAction },
        });

        return {
          provider,
          testType: 'callback_replay',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'Callback replay recovery test failed', {
        provider,
        testType: 'callback_replay',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider,
        testType: 'callback_replay',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testWorkerRestartRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-worker-restart-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'worker_restart',
        event_source: 'recovery_test',
        payload: { testType: 'worker_restart' },
      });

      const recoveryAction = await this.validation.validateWorkerRestartRecovery(executionId);

      if (recoveryAction.recoveryAction === 'resume') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'Worker restart recovery validated',
          context: { testType: 'worker_restart', recoveryAction },
        });

        return {
          provider: 'runtime',
          testType: 'worker_restart',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'Worker restart recovery test failed', {
        testType: 'worker_restart',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'runtime',
        testType: 'worker_restart',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testN8nOutageRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-n8n-outage-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'n8n_outage',
        event_source: 'recovery_test',
        payload: { testType: 'n8n_outage' },
      });

      const recoveryAction = await this.validation.validateCallbackReplayRecovery(executionId, `callback-${Date.now()}`);

      if (recoveryAction.recoveryAction === 'continue') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'n8n outage recovery validated',
          context: { testType: 'n8n_outage', recoveryAction },
        });

        return {
          provider: 'n8n',
          testType: 'n8n_outage',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'n8n outage recovery test failed', {
        testType: 'n8n_outage',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'n8n',
        testType: 'n8n_outage',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async testExecutionContinuationRecovery(): Promise<ProviderRecoveryTestResult> {
    const startTime = Date.now();
    const executionId = `test-execution-continuation-${Date.now()}`;

    try {
      await this.runtime.event.publishEvent({
        tenant_id: this.tenantId,
        execution_id: executionId,
        event_name: 'execution_continuation',
        event_source: 'recovery_test',
        payload: { testType: 'execution_continuation' },
      });

      const recoveryAction = await this.validation.validateExecutionContinuationRecovery(executionId);

      if (recoveryAction.recoveryAction === 'continue') {
        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: 'Execution continuation recovery validated',
          context: { testType: 'execution_continuation', recoveryAction },
        });

        return {
          provider: 'runtime',
          testType: 'execution_continuation',
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        };
      }

      throw new Error('Invalid recovery action');
    } catch (error) {
      await this.runtime.log.writeError(executionId, null, 'Execution continuation recovery test failed', {
        testType: 'execution_continuation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        provider: 'runtime',
        testType: 'execution_continuation',
        success: false,
        executionId,
        tenantId: this.tenantId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      };
    }
  }

  async runAllTests(): Promise<ProviderRecoveryTestResult[]> {
    const results: ProviderRecoveryTestResult[] = [];

    results.push(await this.testDataForSEOTimeoutRecovery());
    results.push(await this.testGSCTimeoutRecovery());
    results.push(await this.testGBPTImeoutRecovery());
    results.push(await this.testCallbackReplayRecovery('dataforseo'));
    results.push(await this.testCallbackReplayRecovery('gsc'));
    results.push(await this.testCallbackReplayRecovery('gbp'));
    results.push(await this.testWorkerRestartRecovery());
    results.push(await this.testN8nOutageRecovery());
    results.push(await this.testExecutionContinuationRecovery());

    return results;
  }
}
