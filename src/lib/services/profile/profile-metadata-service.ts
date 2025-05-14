
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Service to handle profile metadata loading
 */
export class ProfileMetadataService {
  private emitter: BrowserEventEmitter;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
  }
  
  /**
   * Connect to optimal relays for fetching profile data
   */
  public async connectToOptimalRelays(): Promise<void> {
    // Ensure connected to some basic relays
    await nostrService.connectToUserRelays();
    return;
  }
  
  /**
   * Load metadata for a profile
   */
  public async loadMetadata(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // First check cache for immediate rendering
      const cachedProfile = cacheManager.get<Record<string, any>>(`profile:${pubkey}`);
      
      if (cachedProfile) {
        // Emit cached data immediately for fast rendering
        this.emitter.emit('metadata-received', pubkey, cachedProfile);
        
        // Still mark as loading to fetch fresh data in background
        loadingStatus.metadata = 'loading';
        this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      } else {
        // No cached data, mark as loading
        loadingStatus.metadata = 'loading';
        this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      }
      
      // Now fetch latest data from relays
      const profileData = await nostrService.getUserProfile(pubkey);
      
      if (profileData) {
        // Cache for future use
        cacheManager.set(`profile:${pubkey}`, profileData, 5 * 60 * 1000); // 5 minutes
        
        // Emit fresh data
        this.emitter.emit('metadata-received', pubkey, profileData);
      }
      
      // Update loading status
      loadingStatus.metadata = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile metadata:", error);
      loadingStatus.metadata = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
