
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: any[], onEvent: (event: NostrEvent) => void }> = new Map();
  private nextId = 0;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: { kinds?: number[], authors?: string[], since?: number, limit?: number, ids?: string[], '#p'?: string[], '#e'?: string[] }[],
    onEvent: (event: NostrEvent) => void
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // Subscribe using the pool
      this.pool.sub(relays, filters, {
        cb: event => {
          onEvent(event as NostrEvent);
        }
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
        this.pool.close(subscription.relays, subscription.filters);
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
}
