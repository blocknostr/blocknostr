import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';

export class SubscriptionManager {
  private pool: SimplePool;
  private subscriptions: Map<string, { 
    relays: string[], 
    filters: NostrFilter[], 
    subClosers: any[],
    onEvent?: (event: NostrEvent) => void,
    onError?: (error: any) => void
  }> = new Map();
  private nextId = 0;
  private subscriptionErrors: Map<string, {count: number, lastError: any}> = new Map();
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: NostrFilter[],
    onEvent: (event: NostrEvent) => void,
    onError?: (error: any) => void
  ): string {
    if (relays.length === 0) {
      console.error("No relays provided for subscription");
      if (onError) onError(new Error("No relays provided for subscription"));
      return "";
    }
    
    if (filters.length === 0) {
      console.error("No filters provided for subscription");
      if (onError) onError(new Error("No filters provided for subscription"));
      return "";
    }
    
    const id = `sub_${this.nextId++}`;
    
    try {
      // SimplePool.subscribe expects a single filter
      // We'll create multiple subscriptions, one for each filter
      const subClosers = filters.map(filter => {
        return this.pool.subscribe(relays, filter, {
          onevent: (event) => {
            try {
              // Add relay URL to event for tracking
              if (event && typeof event === 'object') {
                // Use a safe approach to store the relay URL
                const customEvent = event as NostrEvent;
                // Store relay URL in a custom property that doesn't clash with standard properties
                (customEvent as any)._relay_url = (event as any).relay?.url;
              }
              
              onEvent(event as NostrEvent);
            } catch (error) {
              console.error(`Error processing event in subscription ${id}:`, error);
              this.recordSubscriptionError(id, error);
              if (onError) onError(error);
            }
          },
          oneose: () => {
            // End of stored events
            console.log(`Subscription ${id} reached EOSE for a filter`);
          }
        });
      });
      
      // Store subscription details for later unsubscribe
      this.subscriptions.set(id, { relays, filters, subClosers, onEvent, onError });
      
      return id;
    } catch (error) {
      console.error("Error creating subscription:", error);
      if (onError) onError(error);
      return "";
    }
  }
  
  private recordSubscriptionError(subId: string, error: any) {
    if (!this.subscriptionErrors.has(subId)) {
      this.subscriptionErrors.set(subId, { count: 1, lastError: error });
    } else {
      const record = this.subscriptionErrors.get(subId)!;
      record.count++;
      record.lastError = error;
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
        this.subscriptionErrors.delete(subId);
      } catch (error) {
        console.error(`Error unsubscribing from ${subId}:`, error);
      }
    }
  }
  
  // Get subscription error info
  getSubscriptionErrors(subId: string) {
    return this.subscriptionErrors.get(subId);
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
  
  // Update the updateRelays method to match the same pattern as the subscribe method
  updateRelays(subId: string, newRelays: string[]): boolean {
    const subscription = this.subscriptions.get(subId);
    if (!subscription) return false;
    
    try {
      // Close existing subscriptions
      subscription.subClosers.forEach(closer => {
        if (closer && typeof closer.close === 'function') {
          closer.close();
        }
      });
      
      // Create new subscriptions with updated relay list
      const newSubClosers = subscription.filters.map(filter => {
        return this.pool.subscribe(newRelays, filter, {
          onevent: (event) => {
            if (subscription.onEvent) {
              // Add relay URL to event for tracking
              if (event && typeof event === 'object') {
                // Store relay URL in a custom property
                (event as any)._relay_url = (event as any).relay?.url;
              }
              
              subscription.onEvent(event as NostrEvent);
            }
          },
          oneose: () => {
            // End of stored events
            console.log(`Updated subscription ${subId} reached EOSE for a filter`);
          }
        });
      });
      
      // Update subscription with new relays and closers
      subscription.relays = newRelays;
      subscription.subClosers = newSubClosers;
      
      return true;
    } catch (error) {
      console.error(`Error updating relays for subscription ${subId}:`, error);
      return false;
    }
  }
}
