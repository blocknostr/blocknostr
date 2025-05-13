
import { nostrService } from "@/lib/nostr";
import { BrowserEventEmitter } from "../BrowserEventEmitter";

/**
 * Service for handling profile relay preferences
 */
export class ProfileRelaysService {
  private eventEmitter: BrowserEventEmitter;
  
  constructor(eventEmitter: BrowserEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Load relay preferences
   */
  public async loadRelays(pubkey: string, isCurrentUser: boolean, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    // Skip if already loading
    if (loadingStatus[pubkey].relays === 'loading') return;
    
    loadingStatus[pubkey].relays = 'loading';
    this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    
    try {
      let relays = [];
      
      // For current user, get relay status
      if (isCurrentUser) {
        relays = nostrService.getRelayStatus();
      } else {
        // For other users, relay preferences would be fetched
        // This would normally be implemented by getting relay lists
        relays = [];
      }
      
      this.eventEmitter.emit('relays-updated', pubkey, relays);
      loadingStatus[pubkey].relays = 'success';
      this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    } catch (error) {
      console.error(`Error loading relays for ${pubkey}:`, error);
      if (loadingStatus[pubkey]) {
        loadingStatus[pubkey].relays = 'error';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      }
    }
  }
}
