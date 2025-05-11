
import { SimplePool } from 'nostr-tools';
import { BookmarkManagerFacade } from '../../bookmark';

/**
 * Core BookmarkService with base functionality
 */
export class BookmarkCoreService {
  constructor(
    protected bookmarkManager: BookmarkManagerFacade, 
    protected pool: SimplePool, 
    protected publicKey: string | null,
    protected getConnectedRelayUrls: () => string[]
  ) {}

  /**
   * Ensure we have connected relays before proceeding with bookmark operations
   * @returns Array of connected relay URLs or throws error if none available
   */
  protected async ensureConnectedRelays(): Promise<string[]> {
    // Get currently connected relays
    let connectedRelays = this.getConnectedRelayUrls();
    
    // If no relays are connected, try to connect
    if (connectedRelays.length === 0) {
      console.log("No connected relays found. Attempting to connect to user relays...");
      
      // Import the nostrService from the index file where it's correctly exported
      const { nostrService } = await import("../../index");
      await nostrService.connectToUserRelays();
      
      // Check if we have connections now
      connectedRelays = this.getConnectedRelayUrls();
      
      if (connectedRelays.length === 0) {
        throw new Error("Failed to connect to any relays. Please check your network connection or relay configuration.");
      }
      
      console.log(`Successfully connected to ${connectedRelays.length} relays`);
    }
    
    return connectedRelays;
  }
}
