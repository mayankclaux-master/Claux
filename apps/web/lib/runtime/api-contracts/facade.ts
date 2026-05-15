/**
 * CLAUX Runtime API Contracts Layer - Facade
 */

import { RequestResponseManager } from './request-response';
import { ExecutionQueryManager } from './execution-query';
import { ReplayQueryManager } from './replay-query';
import { TemporalQueryManager } from './temporal-query';
import { TelemetryQueryManager } from './telemetry-query';
import { GovernanceQueryManager } from './governance-query';

/**
 * API Contracts Facade
 */
export class APIContractsFacade {
  readonly requestResponse: RequestResponseManager;
  readonly executionQuery: ExecutionQueryManager;
  readonly replayQuery: ReplayQueryManager;
  readonly temporalQuery: TemporalQueryManager;
  readonly telemetryQuery: TelemetryQueryManager;
  readonly governanceQuery: GovernanceQueryManager;

  constructor() {
    this.requestResponse = new RequestResponseManager();
    this.executionQuery = new ExecutionQueryManager();
    this.replayQuery = new ReplayQueryManager();
    this.temporalQuery = new TemporalQueryManager();
    this.telemetryQuery = new TelemetryQueryManager();
    this.governanceQuery = new GovernanceQueryManager();
  }
}
