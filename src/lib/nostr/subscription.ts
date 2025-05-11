
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: Filter[], onEvent: (event: NostrEvent) => void }> = new Map();
  private nextId = 0;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: Filter[],
    onEvent: (event: NostrEvent) => void
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // Create subscription
      const sub = this.pool.subscribe(relays, filters);
      
      // Add event handler
      sub.on('event', (event) => {
        onEvent(event as NostrEvent);
      });
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, { relays, filters, onEvent });
      
      return id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return "";
    }
  }
  
  unsubscribe(subId: string): void {
    const subscription = this.subscriptions.get(subId);
    if (subscription) {
      try {
        // Unsubscribe from the subscription
        this.pool.unsubscribe(subscription.relays, subscription.filters);
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
}
