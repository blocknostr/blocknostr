
import { NostrEvent, nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr";
import { BrowserEventEmitter } from "../BrowserEventEmitter";

/**
 * Service for handling profile posts operations
 */
export class ProfilePostsService {
  private eventEmitter: BrowserEventEmitter;
  
  constructor(eventEmitter: BrowserEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Load user posts
   */
  public async loadPosts(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    // Skip if already loading
    if (loadingStatus[pubkey].posts === 'loading') return;
    
    loadingStatus[pubkey].posts = 'loading';
    this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    
    // Check cache first
    const cachedEvents = contentCache.getEventsByAuthors([pubkey]);
    if (cachedEvents && cachedEvents.length > 0) {
      this.processPostEvents(pubkey, cachedEvents, loadingStatus);
    }
    
    try {
      // Create subscription for posts
      const notesSubId = nostrService.subscribe(
        [
          {
            kinds: [1],
            authors: [pubkey],
            limit: 50
          }
        ],
        (event) => this.handlePostEvent(pubkey, event, loadingStatus)
      );
      
      // Auto-close subscription after timeout
      setTimeout(() => {
        nostrService.unsubscribe(notesSubId);
        
        if (loadingStatus[pubkey]?.posts === 'loading') {
          // Update loading status based on whether we received any posts
          if (cachedEvents?.length > 0) {
            loadingStatus[pubkey].posts = 'success';
          } else {
            loadingStatus[pubkey].posts = 'error';
          }
          this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
        }
      }, 10000);
    } catch (error) {
      console.error(`Error loading posts for ${pubkey}:`, error);
      if (loadingStatus[pubkey]) {
        loadingStatus[pubkey].posts = 'error';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Process and categorize post events
   */
  private processPostEvents(pubkey: string, events: NostrEvent[], loadingStatus: Record<string, any>): void {
    // Sort by newest first
    const sortedEvents = [...events].sort((a, b) => b.created_at - a.created_at);
    
    // Process regular posts (kind 1)
    const posts = sortedEvents.filter(e => e.kind === 1);
    
    // Extract media posts
    const media = posts.filter(event => {
      const mediaUrls = this.extractMediaUrls(event);
      return mediaUrls.length > 0;
    });
    
    // Notify listeners
    this.eventEmitter.emit('posts-updated', pubkey, posts);
    this.eventEmitter.emit('media-updated', pubkey, media);
    
    // Mark as successful if we got posts
    if (posts.length > 0 && loadingStatus[pubkey]) {
      loadingStatus[pubkey].posts = 'success';
      this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    }
  }
  
  /**
   * Extract media URLs from a post
   */
  private extractMediaUrls(event: NostrEvent): string[] {
    if (!event.content) return [];
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/g;
    const matches = event.content.match(urlRegex) || [];
    
    // Also check for image tags
    if (event.tags && Array.isArray(event.tags)) {
      const imageTags = event.tags
        .filter(tag => tag[0] === 'image' || tag[0] === 'media')
        .map(tag => tag[1])
        .filter(url => !!url);
      
      return [...matches, ...imageTags];
    }
    
    return matches;
  }
  
  /**
   * Handle incoming post events from subscription
   */
  private handlePostEvent(pubkey: string, event: NostrEvent, loadingStatus: Record<string, any>): void {
    try {
      // Cache the event
      contentCache.cacheEvent(event);
      
      // Notify listeners about the new event
      this.eventEmitter.emit('post-received', pubkey, event);
      
      // Check if it's media
      const mediaUrls = this.extractMediaUrls(event);
      if (mediaUrls.length > 0) {
        this.eventEmitter.emit('media-received', pubkey, event);
      }
      
      // Mark as successful
      if (loadingStatus[pubkey]) {
        loadingStatus[pubkey].posts = 'success';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      }
    } catch (error) {
      console.error("Error handling post event:", error);
    }
  }
}
