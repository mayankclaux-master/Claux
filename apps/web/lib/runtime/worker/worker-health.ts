export class WorkerHealthMonitor {
  async checkWorkerHealth(workerId: string) { return { healthy: true }; }
  async detectStaleWorkers() { return []; }
}
