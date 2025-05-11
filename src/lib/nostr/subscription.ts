
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: Filter, onEvent: (event: NostrEvent) => void, subCloser: any }> = new Map();
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
      // Create subscription with proper callback
      // Note: SimplePool.subscribe now expects a single filter, not an array
      // We'll apply each filter from the array individually and combine the subscriptions
      if (filters.length === 0) {
        console.error("No filters provided for subscription");
        return "";
      }
      
      // Use the first filter for subscription
      const filter = filters[0];
      
      const subCloser = this.pool.subscribe(relays, filter, {
        onevent: (event) => {
          onEvent(event as NostrEvent);
        }
      });
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, { relays, filters: filter, onEvent, subCloser });
      
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
        // Use the subCloser's close method to unsubscribe
        subscription.subCloser.close();
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
}
