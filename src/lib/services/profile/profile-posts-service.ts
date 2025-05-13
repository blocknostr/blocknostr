
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";

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
      
      // Simplified stub implementation
      const posts = await nostrService.getEventsByUser(pubkey);
      
      // Emit post data events
      posts.forEach(post => {
        this.emitter.emit('post-received', pubkey, post);
      });
      
      loadingStatus.posts = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile posts:", error);
      loadingStatus.posts = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
