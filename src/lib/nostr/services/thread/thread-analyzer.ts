
import { NostrEvent } from '../../types';
import { getParentId, getThreadRootId } from './thread-utils';

/**
 * Analyzes thread structure and relationships between events
 */
export class ThreadAnalyzer {
  /**
   * Analyze thread structure and find root, parent and reply events
   */
  analyzeThreadStructure(
    eventId: string,
    events: NostrEvent[],
    mainEvent: NostrEvent | null
  ): {
    rootEvent: NostrEvent | null;
    parentEvent: NostrEvent | null;
    replies: NostrEvent[];
  } {
    // Find root, parent and replies
    const rootEventId = mainEvent ? (getThreadRootId(mainEvent) || eventId) : eventId;
    const rootEvent = events.find(e => e.id === rootEventId) || null;
    
    const parentId = mainEvent ? getParentId(mainEvent) : null;
    const parentEvent = parentId ? events.find(e => e.id === parentId) : null;
    
    const replies = events.filter(e => {
      const parent = getParentId(e);
      return parent === eventId;
    });
    
    return { rootEvent, parentEvent, replies };
  }

  /**
   * Find root, parent and replies in a cached thread
   */
  analyzeCachedThread(
    eventId: string,
    cachedThread: NostrEvent[]
  ): {
    rootEvent: NostrEvent | null;
    parentEvent: NostrEvent | null;
    replies: NostrEvent[];
  } {
    // Find root, parent and replies in the cached thread
    const rootEvent = cachedThread.find(e => !getParentId(e));
    
    // For finding the parent, we need to check which event is referenced by this event's parent tag
    // We use the eventId to find which event is its parent
    const parentEvent = cachedThread.find(e => {
      const eventParentIds = cachedThread
        .filter(ce => ce.id === eventId)
        .map(ce => getParentId(ce));
      
      return eventParentIds.includes(e.id || '');
    });
    
    const replies = cachedThread.filter(e => getParentId(e) === eventId);
    
    return { rootEvent: rootEvent || null, parentEvent: parentEvent || null, replies };
  }
}

