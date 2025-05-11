
import { SimplePool, Filter } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { contentCache } from '../cache/content-cache';

/**
 * Thread service to handle conversation threads
 * Implements NIP-10 for thread support
 */
export class ThreadService {
  constructor(private pool: SimplePool, private getConnectedRelayUrls: () => string[]) {}

  /**
   * Get the thread root event ID from an event
   */
  getThreadRootId(event: NostrEvent): string | null {
    if (!event.tags || !Array.isArray(event.tags)) return null;
    
    // Look for e tag with root marker (NIP-10)
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag.length >= 3 && tag[0] === 'e' && tag[3] === 'root') {
        return tag[1];
      }
    }
    
    // If no root marker, look for first e tag as fallback
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e') {
        return tag[1];
      }
    }
    
    return null;
  }
  
  /**
   * Get the immediate parent event ID from an event
   */
  getParentId(event: NostrEvent): string | null {
    if (!event.tags || !Array.isArray(event.tags)) return null;
    
    // Look for e tag with reply marker (NIP-10)
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag.length >= 3 && tag[0] === 'e' && tag[3] === 'reply') {
        return tag[1];
      }
    }
    
    // Otherwise use last e tag as the parent (NIP-10)
    const eTags = event.tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
    if (eTags.length > 0) {
      return eTags[eTags.length - 1][1];
    }
    
    return null;
  }
  
  /**
   * Fetch a complete thread for an event
   */
  async fetchThread(eventId: string): Promise<{
    rootEvent: NostrEvent | null;
    parentEvent: NostrEvent | null;
    replies: NostrEvent[];
  }> {
    // Check cache first
    const cachedThread = contentCache.getThread(eventId);
    if (cachedThread) {
      // Find root, parent and replies in the cached thread
      const rootEvent = cachedThread.find(e => !this.getParentId(e));
      const parentEvent = cachedThread.find(e => e.id === this.getParentId({ 
        id: eventId, 
        tags: [], 
        content: '', 
        pubkey: '', 
        created_at: 0, 
        sig: '',
        kind: EVENT_KINDS.TEXT_NOTE // Fix: Added missing kind property
      }));
      
      const replies = cachedThread.filter(e => this.getParentId(e) === eventId);
      
      return {
        rootEvent: rootEvent || null,
        parentEvent: parentEvent || null,
        replies
      };
    }
    
    const connectedRelays = this.getConnectedRelayUrls();
    const events: NostrEvent[] = [];
    
    try {
      // Fetch the main event first
      const mainEvent = await this.fetchEvent(eventId);
      
      if (mainEvent) {
        events.push(mainEvent);
        
        // Find root ID
        const rootId = this.getThreadRootId(mainEvent) || eventId;
        
        // Fetch all events in the thread
        const threadEvents = await this.fetchThreadEvents(rootId);
        events.push(...threadEvents);
        
        // Cache the thread
        contentCache.cacheThread(rootId, events);
      }
      
      // Find root, parent and replies
      const rootEventId = mainEvent ? (this.getThreadRootId(mainEvent) || eventId) : eventId; // Fix: Use a variable for rootId
      const rootEvent = events.find(e => e.id === rootEventId) || null;
      const parentId = mainEvent ? this.getParentId(mainEvent) : null;
      const parentEvent = parentId ? events.find(e => e.id === parentId) : null;
      const replies = events.filter(e => {
        const parent = this.getParentId(e);
        return parent === eventId;
      });
      
      return { rootEvent, parentEvent, replies };
      
    } catch (error) {
      console.error("Error fetching thread:", error);
      return { rootEvent: null, parentEvent: null, replies: [] };
    }
  }
  
  /**
   * Fetch a single event by ID
   */
  private async fetchEvent(eventId: string): Promise<NostrEvent | null> {
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
  private async fetchThreadEvents(rootId: string): Promise<NostrEvent[]> {
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
