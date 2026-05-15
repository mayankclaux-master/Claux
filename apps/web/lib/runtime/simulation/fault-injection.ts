/**
 * CLAUX Runtime Simulation Layer - Fault Injection
 */

import type { SimulationId } from './types';
import { FaultInjectionError } from './errors';
import { DEFAULT_FAULT_PROBABILITY } from './constants';

/**
 * Fault Type
 */
export type FaultType = 'latency' | 'error' | 'crash' | 'corruption';

/**
 * Fault Injection Manager
 */
export class FaultInjectionManager {
  private faults: Map<SimulationId, FaultRecord> = new Map();
  private probability: number = DEFAULT_FAULT_PROBABILITY;

  /**
   * Set probability
   */
  setProbability(probability: number): void {
    this.probability = probability;
  }

  /**
   * Inject fault
   */
  inject(type: FaultType, target: string): SimulationId {
    const simulationId = this.generateSimulationId();

    const record: FaultRecord = {
      simulationId,
      type,
      target,
      timestamp: Date.now(),
      injected: true,
    };

    this.faults.set(simulationId, record);
    return simulationId;
  }

  /**
   * Should inject
   */
  shouldInject(): boolean {
    return Math.random() < this.probability;
  }

  /**
   * Get fault
   */
  getFault(simulationId: SimulationId): FaultRecord | undefined {
    return this.faults.get(simulationId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.faults.clear();
  }

  /**
   * Generate simulation ID
   */
  private generateSimulationId(): SimulationId {
    return `fault_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Fault Record
 */
interface FaultRecord {
  readonly simulationId: SimulationId;
  readonly type: FaultType;
  readonly target: string;
  readonly timestamp: number;
  readonly injected: boolean;
}
