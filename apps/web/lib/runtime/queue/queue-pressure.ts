export class QueuePressureManager {
  getQueueMetrics() { return { queueDepth: 0, healthy: true }; }
  detectStalledTasks() { return []; }
  detectStarvedTasks() { return []; }
}
