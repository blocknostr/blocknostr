
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";

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
      // Update loading state
      loadingStatus.metadata = 'loading';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      
      // Fetch profile data
      const profileData = await nostrService.getUserProfile(pubkey);
      
      // Emit data
      this.emitter.emit('metadata-received', pubkey, profileData);
      loadingStatus.metadata = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile metadata:", error);
      loadingStatus.metadata = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
