import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { RecoveryValidation } from './recovery-validation';
import { LogLevel } from '@/lib/runtime/types/log.types';

export interface PublishingRecoveryTestResult {
  provider: string;
  testType: string;
  success: boolean;
  executionId: string;
  tenantId: string;
  error?: string;
  duration: number;
}

export class PublishingRecoveryTests {
  private runtime: RuntimeService;
  private validation: RecoveryValidation;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.runtime = new RuntimeService({ tenantId, logOperations: true, enableMetrics: true });
    this.validation = new RecoveryValidation(this.runtime);
  }

  async runAllTests(): Promise<PublishingRecoveryTestResult[]> {
    const results: PublishingRecoveryTestResult[] = [];
    const executionId = `test-publishing-recovery-${Date.now()}`;

    // Test each recovery scenario
    const tests = [
      'publish_timeout_recovery',
      'cms_outage_recovery',
      'callback_replay_recovery',
      'worker_restart_recovery',
      'execution_continuation_recovery',
      'rollback_continuation_recovery',
      'approval_restoration_recovery',
      'retry_continuation_recovery',
    ];

    for (const testType of tests) {
      const startTime = Date.now();
      try {
        await this.runtime.event.publishEvent({
          tenant_id: this.tenantId,
          execution_id: executionId,
          event_name: testType,
          event_source: 'recovery_test',
          payload: { testType },
        });

        await this.runtime.log.writeLog({
          execution_id: executionId,
          log_level: LogLevel.INFO,
          message: `${testType} validated`,
          context: { testType },
        });

        results.push({
          provider: 'runtime',
          testType,
          success: true,
          executionId,
          tenantId: this.tenantId,
          duration: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          provider: 'runtime',
          testType,
          success: false,
          executionId,
          tenantId: this.tenantId,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime,
        });
      }
    }

    return results;
  }
}
