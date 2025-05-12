
import { SimplePool } from 'nostr-tools';
import { NostrEvent, NostrFilter } from './types';
import { EVENT_KINDS } from './constants';

/**
 * Manages subscriptions to Nostr relays
 * Makes sure no subscription is left open indefinitely
 */
export class SubscriptionManager {
  private pool: SimplePool;
  private active: Map<string, any> = new Map();
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }

  /**
   * Subscribe to events from relays
   * @param relayUrls Array of relay URLs to subscribe to
   * @param filters Array of filters to apply
   * @param onEvent Callback function for each event received
   * @returns Subscription ID
   */
  public subscribe(relayUrls: string[], filters: NostrFilter[], onEvent: (event: NostrEvent) => void): string {
    const subId = `sub-${Math.random().toString(36).substring(2, 10)}`;
    
    try {
      // Convert NostrFilter to SimplePool Filter type
      const convertedFilters = filters.map(filter => {
        const newFilter: Record<string, any> = { ...filter };
        // Handle tag filters dynamically
        Object.keys(filter).forEach(key => {
          if (key.startsWith('#')) {
            newFilter[key] = filter[key as keyof NostrFilter];
          }
        });
        return newFilter;
      });
      
      // Create subscription
      const sub = this.pool.subscribeMany(
        relayUrls,
        convertedFilters,
        {
          onevent: onEvent,
          onclose: () => {
            console.log(`Subscription ${subId} closed`);
          }
        }
      );
      
      // Store subscription
      this.active.set(subId, sub);
      
      return subId;
    } catch (error) {
      console.error("Error creating subscription:", error);
      return subId;
    }
  }

  /**
   * Unsubscribe from a subscription
   * @param subId The subscription ID to unsubscribe from
   */
  public unsubscribe(subId: string): void {
    const sub = this.active.get(subId);
    if (sub) {
      try {
        sub.close();
      } catch (error) {
        console.error(`Error closing subscription ${subId}:`, error);
      }
      this.active.delete(subId);
    }
  }

  /**
   * Get all active subscriptions
   * @returns Map of all active subscriptions
   */
  public getActive(): Map<string, any> {
    return this.active;
  }
  
  /**
   * Close all active subscriptions
   */
  public closeAll(): void {
    this.active.forEach((sub, id) => {
      try {
        sub.close();
      } catch (error) {
        console.error(`Error closing subscription ${id}:`, error);
      }
    });
    this.active.clear();
  }
}
