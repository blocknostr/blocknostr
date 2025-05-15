
import { BaseAdapter } from './base-adapter';
import { EventAdapterInterface } from '../types/adapter';

/**
 * Adapter for event operations
 * Handles event publishing and subscription
 */
export class EventAdapter extends BaseAdapter implements EventAdapterInterface {
  // Event subscription methods
  public subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  public unsubscribe(subId: string): void {
    return this.service.unsubscribe(subId);
  }
  
  // Event publishing method
  public async publishEvent(event: any): Promise<string | null> {
    return this.service.publishEvent(event);
  }
}
