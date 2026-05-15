/**
 * Event Listener Registry
 * Manages event listeners and routing for the CLAUX event system
 */

import { ClauxEvent, EventHandler, EventListenerConfig } from './types';

export class EventListenerRegistry {
  private listeners: Map<string, Set<EventHandler<any>>> = new Map();

  /**
   * Register an event listener
   */
  on<T extends ClauxEvent>(config: EventListenerConfig<T>): void {
    const { eventName, handler, filter } = config;

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    const wrappedHandler: EventHandler<T> = async (event: T) => {
      if (filter && !filter(event)) {
        return;
      }
      await handler(event);
    };

    this.listeners.get(eventName)!.add(wrappedHandler);
  }

  /**
   * Remove an event listener
   */
  off<T extends ClauxEvent>(eventName: T['event_name'], handler: EventHandler<T>): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  async emit<T extends ClauxEvent>(event: T): Promise<void> {
    const handlers = this.listeners.get(event.event_name);
    if (!handlers) {
      return;
    }

    const promises = Array.from(handlers).map(handler =>
      handler(event).catch(error => {
        console.error(`Error in event handler for ${event.event_name}:`, error);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get all listeners for an event
   */
  getListeners<T extends ClauxEvent>(eventName: T['event_name']): EventHandler<T>[] {
    const handlers = this.listeners.get(eventName);
    return handlers ? Array.from(handlers) : [];
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Clear listeners for a specific event
   */
  clearEvent<T extends ClauxEvent>(eventName: T['event_name']): void {
    this.listeners.delete(eventName);
  }
}

// Global event listener registry instance
export const globalEventRegistry = new EventListenerRegistry();
