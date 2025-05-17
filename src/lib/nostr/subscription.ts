
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { relays: string[], filters: NostrFilter[], subClosers: any[], timeoutId?: number }> = new Map();
  private nextId = 0;
  private maxSubscriptions = 100; // Limit total number of subscriptions
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    options: {
      timeoutMs?: number;
      autoClose?: boolean;
    } = {}
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      return "";
    }
    
    if (filters.length === 0) {
      console.error("No filters provided for subscription");
      return "";
    }
    
    // Check if we're at the subscription limit
    if (this.subscriptions.size >= this.maxSubscriptions) {
      console.warn("Maximum subscription limit reached, closing oldest subscription");
      this.closeOldestSubscription();
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // SimplePool.subscribe expects a single filter
      // We'll create multiple subscriptions, one for each filter
      const subClosers = filters.map(filter => {
        try {
          return this.pool.subscribe(relays, filter, {
            onevent: (event) => {
              onEvent(event as NostrEvent);
            }
          });
        } catch (error) {
          console.error("Error creating individual subscription:", error);
          return null;
        }
      }).filter(Boolean); // Filter out any nulls from failed subscriptions
      
      if (subClosers.length === 0) {
        console.error("All subscriptions failed to create");
        return "";
      }
      
      // Store subscription details
      const subDetails: any = { relays, filters, subClosers };
      
      // Set up auto-close timeout if requested
      if (options.autoClose !== false && options.timeoutMs) {
        subDetails.timeoutId = window.setTimeout(() => {
          console.log(`Auto-closing subscription ${id} after timeout`);
          this.unsubscribe(id);
        }, options.timeoutMs);
      }
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, subDetails);
      
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
        // Clear any timeout
        if (subscription.timeoutId) {
          clearTimeout(subscription.timeoutId);
        }
        
        // Close all subscriptions
        subscription.subClosers.forEach(closer => {
          if (closer && typeof closer.close === 'function') {
            try {
              closer.close();
            } catch (error) {
              console.error(`Error closing subscription:`, error);
            }
          }
        });
        
        this.subscriptions.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
  
  // Close the oldest subscription to prevent resource exhaustion
  private closeOldestSubscription(): void {
    if (this.subscriptions.size === 0) return;
    
    const oldestId = Array.from(this.subscriptions.keys())[0];
    this.unsubscribe(oldestId);
  }
  
  // New method to check if a subscription exists
  hasSubscription(subId: string): boolean {
    return this.subscriptions.has(subId);
  }
  
  // New method to get all active subscription IDs
  getActiveSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  // New method to unsubscribe from all subscriptions
  unsubscribeAll(): void {
    this.getActiveSubscriptionIds().forEach(id => this.unsubscribe(id));
  }
  
  // New method to get count of active subscriptions
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
