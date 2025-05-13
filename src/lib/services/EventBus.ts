
import { BrowserEventEmitter } from "./BrowserEventEmitter";

/**
 * Simple event bus for application-wide events
 */
class EventBus extends BrowserEventEmitter {
  /**
   * Remove all listeners for an event
   */
  clearEvent(event: string): void {
    this.removeAllListeners(event);
  }
  
  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    this.removeAllListeners();
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
