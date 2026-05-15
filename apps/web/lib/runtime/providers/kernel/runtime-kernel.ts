/**
 * Runtime Kernel
 * 
 * Minimal runtime kernel that validates the existing runtime contracts and adapters.
 * Coordinates provider implementations to validate runtime lifecycle semantics.
 * 
 * This is a semantic validation kernel, NOT production-ready.
 * 
 * Responsibilities ONLY:
 * - connect providers
 * - invoke runtime contracts
 * - coordinate execution lifecycle
 * - dispatch tasks
 * - propagate events
 * - invoke recovery flows
 * - coordinate checkpoints
 * 
 * Does NOT implement:
 * - workflow engine
 * - DAG execution
 * - graph runtime
 * - AI execution runtime
 * - orchestration compiler
 * - distributed scheduler
 */

import type {
  ExecutionId,
  ExecutionOptions,
  TaskId,
  TaskOptions,
} from '../../contracts';
import {
  ExecutionStatus,
  TaskStatus,
} from '../../contracts';
import type {
  QueueAdapter,
  QueueAdapterConfig,
} from '../../adapters';
import type {
  EventBusAdapter,
  EventBusAdapterConfig,
  RuntimeEvent,
} from '../../adapters';
import type {
  CheckpointStorageAdapter,
  CheckpointStorageAdapterConfig,
  StoredCheckpoint,
} from '../../adapters';
import type {
  SchedulingAdapter,
  SchedulingAdapterConfig,
} from '../../adapters';

// Local kernel types for semantic validation
interface KernelExecution {
  executionId: ExecutionId;
  status: ExecutionStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  options: ExecutionOptions;
  tasks: TaskId[];
}

interface KernelTask {
  taskId: TaskId;
  executionId: ExecutionId;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: unknown;
  options: TaskOptions;
}

export interface RuntimeKernelConfig {
  readonly queueProvider: QueueAdapter;
  readonly queueConfig: QueueAdapterConfig;
  readonly eventProvider: EventBusAdapter;
  readonly eventConfig: EventBusAdapterConfig;
  readonly checkpointProvider: CheckpointStorageAdapter;
  readonly checkpointConfig: CheckpointStorageAdapterConfig;
  readonly schedulingProvider: SchedulingAdapter;
  readonly schedulingConfig: SchedulingAdapterConfig;
}

export class RuntimeKernel {
  private queueProvider: QueueAdapter;
  private eventProvider: EventBusAdapter;
  private checkpointProvider: CheckpointStorageAdapter;
  private schedulingProvider: SchedulingAdapter;
  private queueConfig: QueueAdapterConfig;
  private eventConfig: EventBusAdapterConfig;
  private checkpointConfig: CheckpointStorageAdapterConfig;
  private schedulingConfig: SchedulingAdapterConfig;
  private initialized: boolean = false;
  private executions: Map<ExecutionId, KernelExecution> = new Map();
  private tasks: Map<TaskId, KernelTask> = new Map();
  private executionIdCounter: number = 0;
  private taskIdCounter: number = 0;

  constructor(config: RuntimeKernelConfig) {
    this.queueProvider = config.queueProvider;
    this.eventProvider = config.eventProvider;
    this.checkpointProvider = config.checkpointProvider;
    this.schedulingProvider = config.schedulingProvider;
    this.queueConfig = config.queueConfig;
    this.eventConfig = config.eventConfig;
    this.checkpointConfig = config.checkpointConfig;
    this.schedulingConfig = config.schedulingConfig;
  }

  // =====================================================
  // Kernel Lifecycle
  // =====================================================

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Kernel already initialized');
    }

    // Initialize all providers
    await this.queueProvider.initialize(this.queueConfig);
    await this.eventProvider.initialize(this.eventConfig);
    await this.checkpointProvider.initialize(this.checkpointConfig);
    await this.schedulingProvider.initialize(this.schedulingConfig);

    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    await this.queueProvider.shutdown();
    await this.eventProvider.shutdown();
    await this.checkpointProvider.shutdown();
    await this.schedulingProvider.shutdown();

    this.executions.clear();
    this.tasks.clear();
    this.initialized = false;
  }

  // =====================================================
  // Execution Lifecycle
  // =====================================================

  async createExecution(options: ExecutionOptions): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const executionId = `exec-${++this.executionIdCounter}`;
    const execution: KernelExecution = {
      executionId,
      status: ExecutionStatus.PENDING,
      createdAt: new Date(),
      options,
      tasks: [],
    };

    this.executions.set(executionId, execution);

    // Publish execution created event
    await this.publishEvent({
      eventType: 'execution.created',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: execution,
    });

    return execution;
  }

  async startExecution(executionId: ExecutionId): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.status = ExecutionStatus.RUNNING;
    execution.startedAt = new Date();

    // Publish execution started event
    await this.publishEvent({
      eventType: 'execution.started',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: execution,
    });

    return execution;
  }

  async completeExecution(executionId: ExecutionId): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.status = ExecutionStatus.COMPLETED;
    execution.completedAt = new Date();

    // Publish execution completed event
    await this.publishEvent({
      eventType: 'execution.completed',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: execution,
    });

    return execution;
  }

  async failExecution(executionId: ExecutionId, error: Error): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    execution.status = ExecutionStatus.FAILED;
    execution.failedAt = new Date();
    execution.error = error.message;

    // Publish execution failed event
    await this.publishEvent({
      eventType: 'execution.failed',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: { execution, error: error.message },
    });

    return execution;
  }

  // =====================================================
  // Task Lifecycle
  // =====================================================

  async createTask(executionId: ExecutionId, options: TaskOptions): Promise<KernelTask> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const taskId = `task-${++this.taskIdCounter}`;
    const task: KernelTask = {
      taskId,
      executionId,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      options,
    };

    this.tasks.set(taskId, task);
    execution.tasks.push(taskId);

    // Publish task created event
    await this.publishEvent({
      eventType: 'task.created',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: task,
    });

    return task;
  }

  async dispatchTask(taskId: TaskId): Promise<void> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();

    // Enqueue task for execution - publish as event
    await this.eventProvider.publish('kernel', {
      eventType: 'task.dispatch',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: task,
    }, undefined);

    // Publish task dispatched event
    await this.publishEvent({
      eventType: 'task.dispatched',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: task,
    });
  }

  async completeTask(taskId: TaskId, result: unknown): Promise<void> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = new Date();
    task.result = result;

    // Publish task completed event
    await this.publishEvent({
      eventType: 'task.completed',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: { task, result },
    });
  }

  async failTask(taskId: TaskId, error: Error): Promise<void> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    task.status = TaskStatus.FAILED;
    task.failedAt = new Date();
    task.error = error.message;

    // Publish task failed event
    await this.publishEvent({
      eventType: 'task.failed',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: { task, error: error.message },
    });
  }

  // =====================================================
  // Checkpoint Management
  // =====================================================

  async createCheckpoint(executionId: ExecutionId): Promise<StoredCheckpoint> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error('Execution not found');
    }

    const checkpoint: StoredCheckpoint = {
      checkpointId: `checkpoint-${Date.now()}`,
      executionId,
      checkpointType: 'snapshot' as any,
      state: {
        executionId,
        stateData: { execution },
        taskStates: {},
        timestamp: new Date(),
        sequence: 0,
      },
      metadata: {
        source: 'kernel',
        version: '1.0.0',
        tags: [],
      },
      serializedData: {
        format: 'json' as any,
        data: JSON.stringify({
          execution,
          tasks: Array.from(this.tasks.entries()).filter(([_, t]) => t.executionId === executionId).map(([_, t]) => t),
        }),
      } as any,
      storedAt: new Date(),
      sizeBytes: 0,
    };

    await this.checkpointProvider.storeCheckpoint(checkpoint);

    // Publish checkpoint created event
    await this.publishEvent({
      eventType: 'checkpoint.created',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: checkpoint,
    });

    return checkpoint;
  }

  async restoreCheckpoint(checkpointId: string): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    const checkpoint = await this.checkpointProvider.retrieveCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }

    const execution = checkpoint.serializedData as any as KernelExecution;
    this.executions.set(execution.executionId, execution);

    // Restore tasks
    const tasks = checkpoint.serializedData as any as { tasks: KernelTask[] };
    if (tasks.tasks) {
      for (const task of tasks.tasks) {
        this.tasks.set(task.taskId, task);
      }
    }

    // Publish checkpoint restored event
    await this.publishEvent({
      eventType: 'checkpoint.restored',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: checkpoint,
    });

    return execution;
  }

  // =====================================================
  // Recovery Management
  // =====================================================

  async recoverExecution(executionId: ExecutionId): Promise<KernelExecution> {
    if (!this.initialized) {
      throw new Error('Kernel not initialized');
    }

    // Find latest checkpoint
    const checkpoints = await this.checkpointProvider.retrieveByExecution(executionId);
    if (checkpoints.length === 0) {
      throw new Error('No checkpoints found for execution');
    }

    const latestCheckpoint = checkpoints[checkpoints.length - 1];
    const execution = await this.restoreCheckpoint(latestCheckpoint.checkpointId);

    // Resume execution
    await this.startExecution(execution.executionId);

    // Publish recovery event
    await this.publishEvent({
      eventType: 'execution.recovered',
      eventId: `event-${Date.now()}`,
      topic: 'kernel',
      timestamp: new Date(),
      headers: {},
      metadata: {},
      payload: execution,
    });

    return execution;
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  private async publishEvent(event: RuntimeEvent): Promise<void> {
    try {
      await this.eventProvider.publish(event.topic, event, undefined);
    } catch (error) {
      console.error('Failed to publish event:', error);
    }
  }

  getExecution(executionId: ExecutionId): KernelExecution | undefined {
    return this.executions.get(executionId);
  }

  getTask(taskId: TaskId): KernelTask | undefined {
    return this.tasks.get(taskId);
  }

  listExecutions(): readonly KernelExecution[] {
    return Array.from(this.executions.values());
  }

  listTasks(executionId?: ExecutionId): readonly KernelTask[] {
    if (executionId) {
      return Array.from(this.tasks.values()).filter(t => t.executionId === executionId);
    }
    return Array.from(this.tasks.values());
  }
}

export function createRuntimeKernel(config: RuntimeKernelConfig): RuntimeKernel {
  return new RuntimeKernel(config);
}
