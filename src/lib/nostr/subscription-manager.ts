
import { nostrService } from "./service";

/**
 * Manages subscriptions to Nostr events
 * Provides methods for subscribing, unsubscribing, and tracking active subscriptions
 */
export class SubscriptionManager {
  private subscriptions: Map<string, {
    filters: any[],
    onEvent: (event: any) => void,
    relays?: string[],
    createdAt: number
  }> = new Map();
  
  /**
   * Subscribe to events matching filters
   * @param filters Filters to match events
   * @param onEvent Callback function for matching events
   * @param relays Optional array of specific relays to query
   * @returns Subscription ID
   */
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    const subId = nostrService.subscribe(filters, onEvent, relays);
    
    if (subId) {
      this.subscriptions.set(subId, {
        filters,
        onEvent,
        relays,
        createdAt: Date.now()
      });
    }
    
    return subId;
  }
  
  /**
   * Unsubscribe from events
   * @param subId Subscription ID to unsubscribe
   * @returns Boolean indicating success
   */
  unsubscribe(subId: string): boolean {
    const result = nostrService.unsubscribe(subId);
    
    if (result) {
      this.subscriptions.delete(subId);
    }
    
    return result;
  }
  
  /**
   * Get all active subscriptions
   * @returns Map of subscription IDs to subscription details
   */
  getSubscriptions(): Map<string, any> {
    return this.subscriptions;
  }
  
  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    for (const subId of this.subscriptions.keys()) {
      nostrService.unsubscribe(subId);
    }
    
    this.subscriptions.clear();
  }
  
  /**
   * Get the number of active subscriptions
   * @returns Number of active subscriptions
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}
