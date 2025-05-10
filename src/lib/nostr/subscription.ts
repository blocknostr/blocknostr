
import { SimplePool, type Filter } from 'nostr-tools';
import { NostrEvent, type SubCloser } from './types';

export class SubscriptionManager {
  private subscriptions: Map<string, Set<(event: NostrEvent) => void>> = new Map();
  private pool: SimplePool;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
  }
  
  subscribe(
    relays: string[],
    filters: Filter[],
    onEvent: (event: NostrEvent) => void
  ): SubCloser {
    const subId = `sub_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subId, new Set([onEvent]));
    
    // Use the pool to subscribe according to NIP-01 guidelines
    // Return the SubCloser object from SimplePool
    const subscription = this.pool.subscribeMany(
      relays,
      filters,
      {
        onevent: (event) => {
          const callbacks = this.subscriptions.get(subId);
          if (callbacks) {
            callbacks.forEach(cb => cb(event));
          }
        }
      }
    );
    
    // Return a function that closes the subscription when called
    return () => {
      this.pool.close([subscription]);
      this.subscriptions.delete(subId);
    };
  }
  
  unsubscribe(subHandle: SubCloser): void {
    // Call the function directly to close the subscription
    subHandle();
  }
}
