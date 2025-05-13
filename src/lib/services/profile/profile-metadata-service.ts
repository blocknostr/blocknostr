
import { NostrEvent, nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr";
import { retry } from "@/lib/utils/retry";
import { ProfileMetadata } from "./types";
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";

/**
 * Service for handling profile metadata operations
 */
export class ProfileMetadataService {
  private eventEmitter: BrowserEventEmitter;
  
  constructor(eventEmitter: BrowserEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Connect to optimal relays for profile data loading
   */
  public async connectToOptimalRelays(): Promise<void> {
    try {
      // First ensure connection to user's configured relays
      await nostrService.connectToUserRelays();
      
      // Add popular general relays
      const popularRelays = [
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ];
      
      // Select best relays for reading
      const bestRelays = relaySelector.selectBestRelays(popularRelays, { 
        operation: 'read', 
        count: 3 
      });
      
      await nostrService.addMultipleRelays(bestRelays);
    } catch (error) {
      console.error("Error connecting to relays:", error);
    }
  }
  
  /**
   * Load profile metadata with priority
   */
  public async loadMetadata(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    // Skip if already loading
    if (loadingStatus[pubkey]?.metadata === 'loading') return;
    
    loadingStatus[pubkey].metadata = 'loading';
    this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    
    try {
      // Check cache first
      let profile = contentCache.getProfile(pubkey);
      
      if (!profile) {
        // Retry pattern for reliable loading
        profile = await retry(async () => {
          return nostrService.getUserProfile(pubkey);
        }, {
          maxAttempts: 2,
          baseDelay: 1000
        });
        
        // Cache profile if found
        if (profile) {
          contentCache.cacheProfile(pubkey, profile, true);
        }
      }
      
      if (profile) {
        // Notify listeners
        this.eventEmitter.emit('metadata-updated', pubkey, profile);
        loadingStatus[pubkey].metadata = 'success';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      } else {
        loadingStatus[pubkey].metadata = 'error';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      }
    } catch (error) {
      console.error(`Error loading profile metadata for ${pubkey}:`, error);
      loadingStatus[pubkey].metadata = 'error';
      this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    }
  }
}
