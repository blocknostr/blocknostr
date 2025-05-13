
import { BrowserEventEmitter } from "../BrowserEventEmitter";

/**
 * Service for handling profile reactions and interactions
 */
export class ProfileReactionsService {
  private eventEmitter: BrowserEventEmitter;
  
  constructor(eventEmitter: BrowserEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Load user's reactions
   */
  public async loadReactions(pubkey: string, loadingStatus: Record<string, any>): Promise<void> {
    if (!pubkey) return;
    
    // Skip if already loading
    if (loadingStatus[pubkey].reactions === 'loading') return;
    
    loadingStatus[pubkey].reactions = 'loading';
    this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    
    try {
      // Initialize with empty data
      const reactions: any[] = [];
      const referencedEvents: Record<string, any> = {};
      
      loadingStatus[pubkey].reactions = 'success';
      this.eventEmitter.emit('reactions-updated', pubkey, {
        reactions,
        referencedEvents
      });
      this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
    } catch (error) {
      console.error(`Error loading reactions for ${pubkey}:`, error);
      if (loadingStatus[pubkey]) {
        loadingStatus[pubkey].reactions = 'error';
        this.eventEmitter.emit('loading-state-changed', pubkey, loadingStatus[pubkey]);
      }
    }
  }
}
