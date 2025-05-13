
/**
 * Filter for Nostr events
 */
export class EventFilter {
  /**
   * Filter events by kind
   */
  static byKind(events: any[], kind: number) {
    return events.filter(event => event.kind === kind);
  }
  
  /**
   * Filter events by author
   */
  static byAuthor(events: any[], pubkey: string) {
    return events.filter(event => event.pubkey === pubkey);
  }
  
  /**
   * Filter events by tag
   */
  static byTag(events: any[], tagName: string, tagValue?: string) {
    return events.filter(event => {
      if (!event.tags || !Array.isArray(event.tags)) return false;
      
      return event.tags.some(tag => {
        if (!Array.isArray(tag) || tag.length < 2) return false;
        if (tag[0] !== tagName) return false;
        return tagValue ? tag[1] === tagValue : true;
      });
    });
  }
  
  /**
   * Filter events by creation time range
   */
  static byTimeRange(events: any[], since?: number, until?: number) {
    return events.filter(event => {
      if (since && event.created_at < since) return false;
      if (until && event.created_at > until) return false;
      return true;
    });
  }
  
  /**
   * Filter events by recently created (within X seconds)
   */
  static byRecentlyCreated(events: any[], withinSeconds: number = 3600) {
    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - withinSeconds;
    return events.filter(event => event.created_at >= cutoff);
  }
  
  /**
   * Filter events by content search
   */
  static byContentSearch(events: any[], searchTerm: string) {
    const lowercaseSearch = searchTerm.toLowerCase();
    return events.filter(event => {
      if (!event.content) return false;
      return event.content.toLowerCase().includes(lowercaseSearch);
    });
  }
  
  /**
   * Combine multiple filters
   */
  static combine(events: any[], filters: ((events: any[]) => any[])[]) {
    return filters.reduce((filtered, filter) => filter(filtered), events);
  }
}
