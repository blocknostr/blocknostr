
import { NostrEvent } from "./types";

/**
 * Manages subscriptions to Nostr events
 */
export class SubscriptionManager {
  private subscriptions: Map<string, {
    filters: any[];
    callbacks: ((event: NostrEvent) => void)[];
    relays?: string[];
  }> = new Map();
  
  /**
   * Add a subscription
   * @param id Subscription ID
   * @param filters Nostr filters
   * @param callback Callback function for events
   * @param relays Optional array of relay URLs
   */
  addSubscription(
    id: string,
    filters: any[],
    callback: (event: NostrEvent) => void,
    relays?: string[]
  ): void {
    if (this.subscriptions.has(id)) {
      // Add callback to existing subscription
      const sub = this.subscriptions.get(id)!;
      sub.callbacks.push(callback);
    } else {
      // Create new subscription
      this.subscriptions.set(id, {
        filters,
        callbacks: [callback],
        relays
      });
    }
  }
  
  /**
   * Remove a subscription
   * @param id Subscription ID
   * @param callback Optional callback to remove (if not provided, removes all)
   * @returns Boolean indicating if subscription was fully removed
   */
  removeSubscription(id: string, callback?: (event: NostrEvent) => void): boolean {
    if (!this.subscriptions.has(id)) {
      return false;
    }
    
    const sub = this.subscriptions.get(id)!;
    
    if (callback) {
      // Remove specific callback
      sub.callbacks = sub.callbacks.filter(cb => cb !== callback);
      
      // If no callbacks left, remove subscription
      if (sub.callbacks.length === 0) {
        this.subscriptions.delete(id);
        return true;
      }
      
      return false;
    } else {
      // Remove entire subscription
      this.subscriptions.delete(id);
      return true;
    }
  }
  
  /**
   * Get a subscription by ID
   * @param id Subscription ID
   * @returns Subscription or undefined
   */
  getSubscription(id: string) {
    return this.subscriptions.get(id);
  }
  
  /**
   * Get all subscription IDs
   * @returns Array of subscription IDs
   */
  getSubscriptionIds(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  /**
   * Check if a subscription exists
   * @param id Subscription ID
   * @returns Boolean indicating if subscription exists
   */
  hasSubscription(id: string): boolean {
    return this.subscriptions.has(id);
  }
}
