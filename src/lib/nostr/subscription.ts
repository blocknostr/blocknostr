
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: NostrFilter[], subClosers: any[] }> = new Map();
  private nextId = 0;
  private defaultRelays = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://nostr.bitcoiner.social',
    'wss://relay.nostr.band'
  ];
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void
  ): string {
    // Use default relays if none provided
    const relaysToUse = relays.length > 0 ? relays : this.defaultRelays;
    
    if (filters.length === 0) {
      console.warn("No filters provided for subscription");
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // SimplePool.subscribe expects a single filter
      // We'll create multiple subscriptions, one for each filter
      const subClosers = filters.map(filter => {
        try {
          return this.pool.subscribe(relaysToUse, filter, {
            onevent: (event) => {
              onEvent(event as NostrEvent);
            }
          });
        } catch (error) {
          console.error(`Error creating filter subscription:`, error);
          return null;
        }
      }).filter(Boolean); // Remove any null subscriptions
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, { relays: relaysToUse, filters, subClosers });
      
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
            try {
              closer.close();
            } catch (error) {
              console.warn("Error closing subscription:", error);
              // Silently continue - the connection might already be closed
            }
          }
        });
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
  
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
