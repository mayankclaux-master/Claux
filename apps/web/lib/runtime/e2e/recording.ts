/**
 * CLAUX Runtime E2E Layer - Recording
 */

/**
 * Execution Recording Manager
 */
export class ExecutionRecordingManager {
  private recordings: Map<string, unknown[]> = new Map();

  /**
   * Start recording
   */
  start(recordingId: string): void {
    this.recordings.set(recordingId, []);
  }

  /**
   * Record event
   */
  record(recordingId: string, event: unknown): void {
    const recording = this.recordings.get(recordingId);
    if (recording) {
      recording.push(event);
    }
  }

  /**
   * Stop recording
   */
  stop(recordingId: string): readonly unknown[] {
    const recording = this.recordings.get(recordingId);
    if (recording) {
      return [...recording];
    }
    return [];
  }

  /**
   * Get recording
   */
  getRecording(recordingId: string): readonly unknown[] {
    return this.recordings.get(recordingId) || [];
  }

  /**
   * Clear
   */
  clear(): void {
    this.recordings.clear();
  }
}
