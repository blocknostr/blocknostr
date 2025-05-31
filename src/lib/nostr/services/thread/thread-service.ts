
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../../types';
import { contentCache } from '../../cache/content-cache';
import { getThreadRootId, getParentId } from './thread-utils';
import { ThreadFetcher } from './thread-fetcher';
import { ThreadAnalyzer } from './thread-analyzer';

/**
 * Thread service to handle conversation threads
 * Implements NIP-10 for thread support
 */
export class ThreadService {
  private threadFetcher: ThreadFetcher;
  private threadAnalyzer: ThreadAnalyzer;
  
  constructor(private pool: SimplePool, private getConnectedRelayUrls: () => string[]) {
    this.threadFetcher = new ThreadFetcher(pool, getConnectedRelayUrls);
    this.threadAnalyzer = new ThreadAnalyzer();
  }

  /**
   * Get the thread root event ID from an event
   */
  getThreadRootId(event: NostrEvent): string | null {
    return getThreadRootId(event);
  }
  
  /**
   * Get the immediate parent event ID from an event
   */
  getParentId(event: NostrEvent): string | null {
    return getParentId(event);
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
      return this.threadAnalyzer.analyzeCachedThread(eventId, cachedThread);
    }
    
    const events: NostrEvent[] = [];
    
    try {
      // Fetch the main event first
      const mainEvent = await this.threadFetcher.fetchEvent(eventId);
      
      if (mainEvent) {
        events.push(mainEvent);
        
        // Find root ID
        const rootId = this.getThreadRootId(mainEvent) || eventId;
        
        // Fetch all events in the thread
        const threadEvents = await this.threadFetcher.fetchThreadEvents(rootId);
        events.push(...threadEvents);
        
        // Cache the thread
        contentCache.cacheThread(rootId, events);
      }
      
      // Analyze thread structure
      return this.threadAnalyzer.analyzeThreadStructure(eventId, events, mainEvent);
      
    } catch (error) {
      console.error("Error fetching thread:", error);
      return { rootEvent: null, parentEvent: null, replies: [] };
    }
  }
}

