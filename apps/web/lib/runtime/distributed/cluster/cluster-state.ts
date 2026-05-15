/**
 * CLAUX Runtime Distributed Layer - Cluster State
 * 
 * Manages cluster state and transitions.
 * No external dependencies - pure state semantics.
 */

import type { ClusterId, ClusterMembershipState, ClusterInfo } from '../types';
import { ClusterMembershipState as ClusterMembershipStateEnum } from '../types';

/**
 * Cluster State Manager
 * 
 * Manages cluster state and transitions.
 */
export class ClusterStateManager {
  private clusterId: ClusterId;
  private state: ClusterMembershipState;
  private stateHistory: StateTransition[] = [];
  private lastTransitionTime: Date;

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
    this.state = ClusterMembershipStateEnum.FORMING;
    this.lastTransitionTime = new Date();
  }

  /**
   * Get current state
   */
  getState(): ClusterMembershipState {
    return this.state;
  }

  /**
   * Transition to new state
   */
  transitionTo(newState: ClusterMembershipState, reason: string): void {
    if (!this.isValidTransition(this.state, newState)) {
      throw new Error(
        `Invalid state transition from ${this.state} to ${newState}`
      );
    }

    const transition: StateTransition = {
      fromState: this.state,
      toState: newState,
      timestamp: new Date(),
      reason,
    };

    this.stateHistory.push(transition);
    this.state = newState;
    this.lastTransitionTime = new Date();
  }

  /**
   * Check if transition is valid
   */
  private isValidTransition(from: ClusterMembershipState, to: ClusterMembershipState): boolean {
    const validTransitions: Record<ClusterMembershipState, ClusterMembershipState[]> = {
      [ClusterMembershipStateEnum.FORMING]: [
        ClusterMembershipStateEnum.FORMING,
        ClusterMembershipStateEnum.STABLE,
        ClusterMembershipStateEnum.DEGRADED,
      ],
      [ClusterMembershipStateEnum.STABLE]: [
        ClusterMembershipStateEnum.STABLE,
        ClusterMembershipStateEnum.DEGRADED,
        ClusterMembershipStateEnum.RECOVERING,
      ],
      [ClusterMembershipStateEnum.DEGRADED]: [
        ClusterMembershipStateEnum.DEGRADED,
        ClusterMembershipStateEnum.STABLE,
        ClusterMembershipStateEnum.FORMING,
        ClusterMembershipStateEnum.RECOVERING,
      ],
      [ClusterMembershipStateEnum.RECOVERING]: [
        ClusterMembershipStateEnum.RECOVERING,
        ClusterMembershipStateEnum.STABLE,
        ClusterMembershipStateEnum.DEGRADED,
      ],
    };

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Get state history
   */
  getStateHistory(): readonly StateTransition[] {
    return [...this.stateHistory];
  }

  /**
   * Get last transition time
   */
  getLastTransitionTime(): Date {
    return this.lastTransitionTime;
  }

  /**
   * Get time in current state
   */
  getTimeInCurrentState(): number {
    return Date.now() - this.lastTransitionTime.getTime();
  }

  /**
   * Check if state is stable
   */
  isStable(): boolean {
    return this.state === ClusterMembershipStateEnum.STABLE;
  }

  /**
   * Check if state is degraded
   */
  isDegraded(): boolean {
    return this.state === ClusterMembershipStateEnum.DEGRADED;
  }

  /**
   * Check if state is forming
   */
  isForming(): boolean {
    return this.state === ClusterMembershipStateEnum.FORMING;
  }

  /**
   * Check if state is recovering
   */
  isRecovering(): boolean {
    return this.state === ClusterMembershipStateEnum.RECOVERING;
  }

  /**
   * Get state statistics
   */
  getStatistics(): {
    currentState: ClusterMembershipState;
    totalTransitions: number;
    timeInCurrentState: number;
    averageStateDuration: number;
    stateDurations: Map<ClusterMembershipState, number>;
  } {
    const stateDurations = new Map<ClusterMembershipState, number>();
    let totalDuration = 0;

    for (let i = 0; i < this.stateHistory.length; i++) {
      const transition = this.stateHistory[i];
      const nextTransition = this.stateHistory[i + 1];
      const duration = nextTransition
        ? nextTransition.timestamp.getTime() - transition.timestamp.getTime()
        : Date.now() - transition.timestamp.getTime();

      const currentDuration = stateDurations.get(transition.toState) || 0;
      stateDurations.set(transition.toState, currentDuration + duration);
      totalDuration += duration;
    }

    const avgDuration = this.stateHistory.length > 0 ? totalDuration / this.stateHistory.length : 0;

    return {
      currentState: this.state,
      totalTransitions: this.stateHistory.length,
      timeInCurrentState: this.getTimeInCurrentState(),
      averageStateDuration: avgDuration,
      stateDurations,
    };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = ClusterMembershipStateEnum.FORMING;
    this.stateHistory = [];
    this.lastTransitionTime = new Date();
  }
}

/**
 * State Transition
 */
interface StateTransition {
  readonly fromState: ClusterMembershipState;
  readonly toState: ClusterMembershipState;
  readonly timestamp: Date;
  readonly reason: string;
}
