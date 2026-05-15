/**
 * CLAUX Runtime Execution Engine - Runnable Selector
 * 
 * Selects runnable tasks based on dependencies and constraints.
 * No external dependencies - pure selection logic.
 */

import type { DAG, TaskId, RunnableTask } from '../types';
import { DependencyResolver } from './dependency-resolver';

/**
 * Selection Criteria
 */
export interface SelectionCriteria {
  readonly maxTasks?: number;
  readonly maxPriority?: number;
  readonly minPriority?: number;
  readonly excludeTaskIds?: readonly TaskId[];
  readonly includeTaskIds?: readonly TaskId[];
}

/**
 * Selection Result
 */
export interface SelectionResult {
  readonly selectedTasks: readonly RunnableTask[];
  readonly skippedTasks: readonly TaskId[];
  readonly selectionReason: string;
}

/**
 * Runnable Selector
 * 
 * Selects which tasks should be executed next based on various criteria.
 */
export class RunnableSelector {
  private dependencyResolver: DependencyResolver;

  constructor() {
    this.dependencyResolver = new DependencyResolver();
  }

  /**
   * Select runnable tasks from DAG
   */
  selectRunnableTasks(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>,
    criteria?: SelectionCriteria
  ): SelectionResult {
    const runnableTaskIds = this.dependencyResolver.getRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks
    );

    // Apply criteria filters
    let filteredTaskIds = runnableTaskIds;

    if (criteria?.excludeTaskIds) {
      filteredTaskIds = filteredTaskIds.filter(
        id => !criteria.excludeTaskIds!.includes(id)
      );
    }

    if (criteria?.includeTaskIds) {
      filteredTaskIds = filteredTaskIds.filter(
        id => criteria.includeTaskIds!.includes(id)
      );
    }

    if (criteria?.maxPriority !== undefined) {
      filteredTaskIds = filteredTaskIds.filter(id => {
        const node = dag.nodes.find(n => n.taskId === id);
        return node ? node.priority <= criteria.maxPriority! : true;
      });
    }

    if (criteria?.minPriority !== undefined) {
      filteredTaskIds = filteredTaskIds.filter(id => {
        const node = dag.nodes.find(n => n.taskId === id);
        return node ? node.priority >= criteria.minPriority! : true;
      });
    }

    // Convert to RunnableTask objects
    const runnableTasks = filteredTaskIds.map(id => {
      const node = dag.nodes.find(n => n.taskId === id);
      if (!node) {
        throw new Error(`Task ${id} not found in DAG`);
      }

      return {
        taskId: id,
        node,
        priority: node.priority,
      };
    });

    // Sort by priority (higher priority first)
    runnableTasks.sort((a, b) => b.priority - a.priority);

    // Apply max tasks limit
    let selectedTasks = runnableTasks;
    let skippedTasks: TaskId[] = [];

    if (criteria?.maxTasks && criteria.maxTasks < runnableTasks.length) {
      selectedTasks = runnableTasks.slice(0, criteria.maxTasks);
      skippedTasks = runnableTasks.slice(criteria.maxTasks).map(t => t.taskId);
    }

    return {
      selectedTasks,
      skippedTasks,
      selectionReason: this.getSelectionReason(selectedTasks.length, runnableTasks.length),
    };
  }

  /**
   * Select a single runnable task (highest priority)
   */
  selectNextTask(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>
  ): RunnableTask | undefined {
    const result = this.selectRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks,
      { maxTasks: 1 }
    );

    return result.selectedTasks[0];
  }

  /**
   * Select tasks for parallel execution
   */
  selectParallelTasks(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>,
    maxParallelism: number
  ): SelectionResult {
    return this.selectRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks,
      { maxTasks: maxParallelism }
    );
  }

  /**
   * Select tasks by priority level
   */
  selectTasksByPriority(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>,
    minPriority: number,
    maxPriority: number
  ): SelectionResult {
    return this.selectRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks,
      { minPriority, maxPriority }
    );
  }

  /**
   * Select critical path tasks
   */
  selectCriticalPathTasks(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>
  ): SelectionResult {
    const criticalPath = this.dependencyResolver.getCriticalPath(dag, new Map());
    const criticalPathSet = new Set(criticalPath);

    const result = this.selectRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks,
      { includeTaskIds: criticalPath }
    );

    return {
      ...result,
      selectionReason: 'Critical path tasks selected',
    };
  }

  /**
   * Get selection reason
   */
  private getSelectionReason(selected: number, available: number): string {
    if (selected === available) {
      return 'All runnable tasks selected';
    }

    if (selected === 0) {
      return 'No tasks selected';
    }

    return `Selected ${selected} of ${available} runnable tasks`;
  }

  /**
   * Check if there are any runnable tasks
   */
  hasRunnableTasks(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>
  ): boolean {
    const runnableTaskIds = this.dependencyResolver.getRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks
    );

    return runnableTaskIds.length > 0;
  }

  /**
   * Get count of runnable tasks
   */
  getRunnableTaskCount(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>
  ): number {
    return this.dependencyResolver.getRunnableTasks(
      dag,
      completedTasks,
      inProgressTasks,
      failedTasks,
      cancelledTasks
    ).length;
  }
}
