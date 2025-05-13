
type EventCallback = (...args: any[]) => void;

/**
 * Simple event bus for application-wide events
 */
class EventBus {
  private events: Record<string, EventCallback[]> = {};
  
  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
  
  /**
   * Remove all listeners for an event
   */
  clearEvent(event: string): void {
    this.events[event] = [];
  }
  
  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    this.events = {};
  }
}

export const eventBus = new EventBus();

// Predefined event types
export const EVENTS = {
  RELAY_CONNECTED: 'relay-connected',
  RELAY_DISCONNECTED: 'relay-disconnected',
  PROFILE_UPDATED: 'profile-updated',
  POST_CREATED: 'post-created',
  POST_DELETED: 'post-deleted',
};

// Dispatch relay events to window for service compatibility
eventBus.on(EVENTS.RELAY_CONNECTED, (relay) => {
  window.dispatchEvent(new CustomEvent('relay-connected', { detail: relay }));
});

eventBus.on(EVENTS.RELAY_DISCONNECTED, (relay) => {
  window.dispatchEvent(new CustomEvent('relay-disconnected', { detail: relay }));
});
