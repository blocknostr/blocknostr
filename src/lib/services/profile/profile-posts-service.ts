
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr/cache";
import { extractMediaUrls, isValidMediaUrl } from "@/lib/nostr/utils/media-extraction";

/**
 * Service to handle profile post loading
 */
export class ProfilePostsService {
  private emitter: BrowserEventEmitter;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
  }
  
  /**
   * Load posts for a profile
   */
  public async loadPosts(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.posts = 'loading';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      
      // Check cache first for better UX
      const cachedPosts = contentCache.getEventsByAuthors([pubkey]) || [];
      if (cachedPosts.length > 0) {
        // Filter to only kind 1 (text notes)
        const postsEvents = cachedPosts.filter(e => e.kind === 1);
        
        // Sort by creation time (newest first)
        const sortedPosts = postsEvents.sort((a, b) => b.created_at - a.created_at);
        
        // Filter media posts
        const mediaEvents = postsEvents.filter(event => {
          const mediaUrls = extractMediaUrls(event.content, event.tags);
          const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
          return validMediaUrls.length > 0;
        });
        
        // Emit cached posts
        this.emitter.emit('posts-received', pubkey, sortedPosts);
        this.emitter.emit('media-received', pubkey, mediaEvents.sort((a, b) => b.created_at - a.created_at));
      }
      
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Subscribe to user's notes (kind 1)
      const postsList = [...cachedPosts];
      const mediaList: any[] = [];
      
      const postsSubPromise = new Promise<void>(resolve => {
        const subId = nostrService.subscribe(
          [
            {
              kinds: [1],
              authors: [pubkey],
              limit: 50
            }
          ],
          (event) => {
            // Check if we already have this event
            if (!postsList.some(e => e.id === event.id)) {
              postsList.push(event);
              
              // Check if post contains media
              const mediaUrls = extractMediaUrls(event.content, event.tags);
              const validMediaUrls = mediaUrls.filter(url => isValidMediaUrl(url));
              
              if (validMediaUrls.length > 0) {
                mediaList.push(event);
              }
              
              // Cache the event
              try {
                contentCache.cacheEvent(event);
              } catch (cacheError) {
                console.warn("Failed to cache event:", cacheError);
              }
            }
          }
        );
        
        // Set timeout to ensure we don't wait forever
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          resolve();
        }, 5000);
      });
      
      await postsSubPromise;
      
      // Sort posts by creation time (newest first)
      const sortedPosts = postsList.sort((a, b) => b.created_at - a.created_at);
      const sortedMedia = mediaList.sort((a, b) => b.created_at - a.created_at);
      
      // Emit final results
      this.emitter.emit('posts-received', pubkey, sortedPosts);
      this.emitter.emit('media-received', pubkey, sortedMedia);
      
      // Update loading state
      loadingStatus.posts = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile posts:", error);
      loadingStatus.posts = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
