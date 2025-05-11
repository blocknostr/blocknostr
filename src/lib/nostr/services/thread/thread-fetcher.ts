
import { SimplePool, Filter } from 'nostr-tools';
import { NostrEvent } from '../../types';
import { EVENT_KINDS } from '../../constants';
import { contentCache } from '../../cache/content-cache';

/**
 * Fetches events for thread construction
 */
export class ThreadFetcher {
  constructor(private pool: SimplePool, private getConnectedRelayUrls: () => string[]) {}
  
  /**
   * Fetch a single event by ID
   */
  async fetchEvent(eventId: string): Promise<NostrEvent | null> {
    // Check cache first
    const cachedEvent = contentCache.getEvent(eventId);
    if (cachedEvent) return cachedEvent;
    
    const connectedRelays = this.getConnectedRelayUrls();
    
    try {
      return new Promise((resolve) => {
        const filter: Filter = {
          ids: [eventId],
          limit: 1
        };
        
        let subscription: { close: () => void } | null = null;
        let resolved = false;
        
        try {
          subscription = this.pool.subscribe(
            connectedRelays,
            filter,
            {
              onevent: (event) => {
                if (resolved) return;
                resolved = true;
                
                // Cache the event
                contentCache.cacheEvent(event as NostrEvent);
                
                resolve(event as NostrEvent);
                
                // Cleanup subscription
                if (subscription) {
                  setTimeout(() => subscription?.close(), 100);
                }
              }
            }
          );
        } catch (error) {
          console.error("Error in subscription:", error);
          resolve(null);
        }
        
        // Set a timeout
        setTimeout(() => {
          if (!resolved) {
            if (subscription) {
              subscription.close();
            }
            resolve(null);
          }
        }, 5000);
      });
      
    } catch (error) {
      console.error("Error fetching event:", error);
      return null;
    }
  }
  
  /**
   * Fetch all events in a thread by root ID
   */
  async fetchThreadEvents(rootId: string): Promise<NostrEvent[]> {
    const connectedRelays = this.getConnectedRelayUrls();
    
    try {
      return new Promise((resolve) => {
        const filter: Filter = {
          '#e': [rootId],
          kinds: [1], // Text notes
          limit: 50
        };
        
        const events: NostrEvent[] = [];
        let subscription: { close: () => void } | null = null;
        
        try {
          subscription = this.pool.subscribe(
            connectedRelays,
            filter,
            {
              onevent: (event) => {
                events.push(event as NostrEvent);
                
                // Cache the event
                contentCache.cacheEvent(event as NostrEvent);
              }
            }
          );
        } catch (error) {
          console.error("Error in subscription:", error);
          resolve([]);
        }
        
        // Set a timeout to collect events
        setTimeout(() => {
          if (subscription) {
            subscription.close();
          }
          resolve(events);
        }, 5000);
      });
      
    } catch (error) {
      console.error("Error fetching thread events:", error);
      return [];
    }
  }
}
