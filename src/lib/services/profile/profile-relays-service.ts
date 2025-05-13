
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { nostrService } from "@/lib/nostr";

/**
 * Service to handle profile relay preferences
 */
export class ProfileRelaysService {
  private emitter: BrowserEventEmitter;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
  }
  
  /**
   * Load relays for a profile
   */
  public async loadRelays(pubkey: string, isCurrentUser: boolean, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    try {
      // Update loading state
      loadingStatus.relays = 'loading';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
      
      // Basic implementation to get any available relays
      const relays = nostrService.getRelayStatus();
      this.emitter.emit('relays-received', pubkey, relays);
      
      loadingStatus.relays = 'success';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    } catch (error) {
      console.error("Error loading profile relays:", error);
      loadingStatus.relays = 'error';
      this.emitter.emit('loading-state-changed', pubkey, loadingStatus);
    }
  }
}
