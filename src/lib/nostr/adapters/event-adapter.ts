
import { nostrService as originalNostrService } from '../service';

/**
 * Event handling adapter methods
 */
export class EventAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // Event methods
  async publishEvent(event: any) {
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
  
  async getEventById(id: string) {
    return this.service.getEventById(id);
  }
  
  async getEvents(ids: string[]) {
    return this.service.getEvents(ids);
  }
}
