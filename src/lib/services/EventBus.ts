
/**
 * A browser-compatible event emitter implementation to avoid Node.js EventEmitter dependency
 * This replaces the Node.js EventEmitter with a browser-compatible version
 */
export class BrowserEventEmitter {
  private events: Record<string, Function[]> = {};
  
  /**
   * Register an event handler
   */
  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }
  
  /**
   * Register a one-time event handler
   */
  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
    return this;
  }
  
  /**
   * Remove an event handler
   */
  off(event: string, listener?: Function): this {
    if (!this.events[event]) return this;
    
    if (listener) {
      this.events[event] = this.events[event].filter(l => l !== listener);
      if (this.events[event].length === 0) {
        delete this.events[event];
      }
    } else {
      delete this.events[event];
    }
    
    return this;
  }
  
  /**
   * Alias for off() to maintain compatibility with Node.js EventEmitter
   */
  removeListener(event: string, listener: Function): this {
    return this.off(event, listener);
  }
  
  /**
   * Remove all event handlers for an event or all events
   */
  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
  
  /**
   * Emit an event with arguments
   */
  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) return false;
    
    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
    
    return true;
  }
}

export const eventBus = new BrowserEventEmitter();

// Predefined event types
export const EVENTS = {
  RELAY_CONNECTED: 'relay-connected',
  RELAY_DISCONNECTED: 'relay-disconnected',
  PROFILE_UPDATED: 'profile-updated',
  PROFILE_BATCH_UPDATED: 'profile-batch-updated',
  POST_CREATED: 'post-created',
  POST_DELETED: 'post-deleted',
  FEED_UPDATED: 'feed-updated'
};

// Dispatch relay events to window for service compatibility
eventBus.on(EVENTS.RELAY_CONNECTED, (relay) => {
  window.dispatchEvent(new CustomEvent('relay-connected', { detail: relay }));
});

eventBus.on(EVENTS.RELAY_DISCONNECTED, (relay) => {
  window.dispatchEvent(new CustomEvent('relay-disconnected', { detail: relay }));
});
