
/**
 * Manages profile prefetching operations
 * Queues related profiles for background loading
 */
export class PrefetchQueue {
  private queue: string[] = [];
  private backgroundRefreshTimer: number | null = null;
  private prefetchHandler?: (pubkeys: string[]) => void;
  
  constructor() {
    this.startBackgroundRefresh();
  }
  
  /**
   * Set the handler that will be called to process prefetch items
   */
  setPrefetchHandler(handler: (pubkeys: string[]) => void): void {
    this.prefetchHandler = handler;
  }
  
  /**
   * Add profiles to the prefetch queue
   */
  queueProfiles(pubkeys: string[]): void {
    if (!pubkeys.length) return;
    
    // Add unique pubkeys to queue
    const uniquePubkeys = [...new Set(pubkeys)];
    this.queue.push(...uniquePubkeys);
    
    // Cap prefetch queue size
    if (this.queue.length > 20) {
      this.queue = this.queue.slice(-20);
    }
  }
  
  /**
   * Extract related profiles from profile data
   */
  extractRelatedProfiles(profileData: any): string[] {
    if (!profileData) return [];
    
    const relatedPubkeys: string[] = [];
    
    // Extract from mentions in profile description
    if (profileData.about) {
      const mentionMatches = profileData.about.match(/nostr:npub[a-z0-9]{59}/g) || [];
      mentionMatches.forEach((match: string) => {
        const pubkey = match.replace('nostr:', '');
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Check for other related profiles in custom fields
    if (profileData.relatedProfiles && Array.isArray(profileData.relatedProfiles)) {
      profileData.relatedProfiles.forEach((pubkey: string) => {
        relatedPubkeys.push(pubkey);
      });
    }
    
    // Return up to 5 unique related profiles
    return [...new Set(relatedPubkeys)].slice(0, 5);
  }
  
  /**
   * Start background refresh for prefetch queue
   */
  private startBackgroundRefresh(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
    }
    
    // Process prefetch queue every 5 minutes
    this.backgroundRefreshTimer = window.setInterval(() => {
      this.processPrefetchQueue();
    }, 5 * 60 * 1000);
  }
  
  /**
   * Process the prefetch queue
   */
  private processPrefetchQueue(): void {
    // Process up to 5 profiles at a time from the queue
    const toProcess = this.queue.splice(0, 5);
    
    if (toProcess.length === 0 || !this.prefetchHandler) return;
    
    // Log for debugging
    console.log(`Background prefetching ${toProcess.length} profiles`, toProcess);
    
    // Call the prefetch handler with profiles to fetch
    this.prefetchHandler(toProcess);
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.backgroundRefreshTimer) {
      clearInterval(this.backgroundRefreshTimer);
      this.backgroundRefreshTimer = null;
    }
    
    this.queue = [];
  }
}
