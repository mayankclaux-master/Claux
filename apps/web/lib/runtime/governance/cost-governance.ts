/**
 * CLAUX Runtime Governance Layer - Cost Governance
 */

import type { CostBudget, TenantId } from './types';
import { QuotaError } from './errors';
import { DEFAULT_BUDGET_PERIOD } from './constants';

/**
 * Cost Governance Manager
 */
export class CostGovernanceManager {
  private budgets: Map<TenantId, CostBudget> = new Map();
  private spend: Map<TenantId, number> = new Map();

  /**
   * Set budget
   */
  setBudget(tenantId: TenantId, budget: CostBudget): void {
    this.budgets.set(tenantId, budget);
  }

  /**
   * Record cost
   */
  recordCost(tenantId: TenantId, cost: number): void {
    const current = this.spend.get(tenantId) || 0;
    this.spend.set(tenantId, current + cost);
  }

  /**
   * Check budget
   */
  checkBudget(tenantId: TenantId): boolean {
    const budget = this.budgets.get(tenantId);
    if (!budget) return true;

    const current = this.spend.get(tenantId) || 0;
    return current < budget.limit;
  }

  /**
   * Get remaining budget
   */
  getRemaining(tenantId: TenantId): number {
    const budget = this.budgets.get(tenantId);
    if (!budget) return 0;

    const current = this.spend.get(tenantId) || 0;
    return Math.max(0, budget.limit - current);
  }

  /**
   * Get utilization
   */
  getUtilization(tenantId: TenantId): number {
    const budget = this.budgets.get(tenantId);
    if (!budget) return 0;

    const current = this.spend.get(tenantId) || 0;
    return current / budget.limit;
  }

  /**
   * Reset period
   */
  resetPeriod(tenantId: TenantId): void {
    this.spend.set(tenantId, 0);
  }

  /**
   * Clear
   */
  clear(): void {
    this.budgets.clear();
    this.spend.clear();
  }
}
