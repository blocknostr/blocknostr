
/**
 * Utility for handling NIP-36 content warnings
 * Implements NIP-36 (Sensitive Content)
 */
export class ContentWarningUtils {
  /**
   * Check if an event has a content warning tag
   * @param event Nostr event to check
   * @returns Boolean indicating if event has content warning
   */
  static hasContentWarning(event: any): boolean {
    if (!event?.tags || !Array.isArray(event.tags)) {
      return false;
    }
    
    return event.tags.some(tag => 
      Array.isArray(tag) && tag.length >= 1 && tag[0] === 'content-warning'
    );
  }
  
  /**
   * Get content warning reasons from an event
   * @param event Nostr event to check
   * @returns Array of content warning reasons or empty array if none
   */
  static getContentWarningReasons(event: any): string[] {
    if (!event?.tags || !Array.isArray(event.tags)) {
      return [];
    }
    
    const cwTags = event.tags.filter(tag => 
      Array.isArray(tag) && tag.length >= 2 && tag[0] === 'content-warning'
    );
    
    // Extract reasons from tags
    const reasons: string[] = [];
    for (const tag of cwTags) {
      if (tag.length >= 2 && tag[1]) {
        reasons.push(tag[1]);
      }
    }
    
    return reasons;
  }
  
  /**
   * Add content warning tag to event
   * @param event Event to modify
   * @param reason Optional reason for the content warning
   * @returns Modified event with content warning
   */
  static addContentWarning(event: any, reason?: string): any {
    if (!event) return event;
    
    const updatedEvent = { ...event };
    
    if (!updatedEvent.tags) {
      updatedEvent.tags = [];
    }
    
    // Add content warning tag
    if (reason) {
      updatedEvent.tags.push(['content-warning', reason]);
    } else {
      updatedEvent.tags.push(['content-warning']);
    }
    
    return updatedEvent;
  }
}
