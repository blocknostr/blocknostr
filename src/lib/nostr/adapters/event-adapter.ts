
import { BaseAdapter } from './base-adapter';

/**
 * Adapter for event operations
 */
export class EventAdapter extends BaseAdapter {
  /**
   * Publish an event to the network
   */
  async publishEvent(event: any) {
    return this.service.publishEvent(event);
  }
  
  /**
   * Subscribe to events
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  /**
   * Unsubscribe from events
   */
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
  
  /**
   * Get a single event by ID
   */
  async getEventById(id: string) {
    return this.service.getEventById(id);
  }
  
  /**
   * Get multiple events by ID
   */
  async getEvents(ids: string[]) {
    return this.service.getEvents(ids);
  }
}
