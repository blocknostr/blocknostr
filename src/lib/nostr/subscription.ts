
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: NostrFilter[], subClosers: any[] }> = new Map();
  private nextId = 0;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      return "";
    }
    
    if (filters.length === 0) {
      console.error("No filters provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // SimplePool.subscribe expects a single filter
      // We'll create multiple subscriptions, one for each filter
      const subClosers = filters.map(filter => {
        return this.pool.subscribe(relays, filter, {
          onevent: (event) => {
            onEvent(event as NostrEvent);
          }
        });
      });
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, { relays, filters, subClosers });
      
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
        // Close all subscriptions
        subscription.subClosers.forEach(closer => {
          if (closer && typeof closer.close === 'function') {
            closer.close();
          }
        });
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
}
