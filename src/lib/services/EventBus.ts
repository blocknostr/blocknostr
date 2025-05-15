
/**
 * Simple event bus for application-wide events
 */
export class EventBus {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(...args);
      } catch (e) {
        console.error(`Error in event handler for ${event}:`, e);
      }
    });
  }
}

export const EVENTS = {
  // Authentication events
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // Relay events
  RELAY_CONNECTED: 'relay_connected',
  RELAY_DISCONNECTED: 'relay_disconnected',
  RELAYS_CONNECTED: 'relays_connected',
  RELAYS_FAILED: 'relays_failed',
  
  // Profile events
  PROFILE_UPDATED: 'profile_updated',
  
  // Community events
  COMMUNITY_CREATED: 'community_created',
  COMMUNITY_UPDATED: 'community_updated',
  PROPOSAL_CREATED: 'proposal_created',
  PROPOSAL_VOTED: 'proposal_voted'
};

// Create and export a singleton instance
export const eventBus = new EventBus();
