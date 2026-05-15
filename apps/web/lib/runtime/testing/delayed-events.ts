/**
 * CLAUX Runtime Testing Layer - Delayed Events
 */

/**
 * Delayed Event
 */
interface DelayedEvent {
  readonly eventId: string;
  readonly event: unknown;
  readonly delay: number;
  readonly scheduledAt: number;
}

/**
 * Delayed Events Manager
 */
export class DelayedEventsManager {
  private events: Map<string, DelayedEvent> = new Map();

  /**
   * Schedule delayed event
   */
  schedule(eventId: string, event: unknown, delay: number): void {
    const delayedEvent: DelayedEvent = {
      eventId,
      event,
      delay,
      scheduledAt: Date.now(),
    };
    this.events.set(eventId, delayedEvent);
  }

  /**
   * Get ready events
   */
  getReady(): readonly DelayedEvent[] {
    const now = Date.now();
    const ready: DelayedEvent[] = [];

    for (const [id, event] of this.events) {
      if (now - event.scheduledAt >= event.delay) {
        ready.push(event);
        this.events.delete(id);
      }
    }

    return ready;
  }

  /**
   * Clear
   */
  clear(): void {
    this.events.clear();
  }
}
