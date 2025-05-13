
import { BaseAdapter } from './base-adapter';
import { parseRelayList } from '../utils/nip';
import { toast } from 'sonner';

/**
 * Adapter for relay operations
 * Implements NIP-65 (Relay List Metadata) for relay management
 */
export class RelayAdapter extends BaseAdapter {
  // Relay methods
  async addRelay(relayUrl: string, readWrite: boolean = true) {
    return this.service.addRelay(relayUrl, readWrite);
  }
  
  removeRelay(relayUrl: string) {
    return this.service.removeRelay(relayUrl);
  }
  
  getRelayStatus() {
    return this.service.getRelayStatus();
  }

  getRelayUrls() {
    return this.service.getRelayUrls();
  }
  
  /**
   * Get relays for a user according to NIP-65
   * 
   * @param pubkey User's public key in hex format
   * @returns Promise resolving to array of relay URLs
   */
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    try {
      // Subscribe to relay list events (NIP-65 kind: 10002)
      return new Promise<string[]>((resolve) => {
        let resolved = false;
        let timeoutId: ReturnType<typeof setTimeout>;
        
        // Create a subscription for the user's relay list events
        const subId = this.service.subscribe(
          [
            {
              kinds: [10002], // Relay List Metadata (NIP-65)
              authors: [pubkey],
              limit: 1
            }
          ],
          (event) => {
            if (event.kind === 10002) {
              // Parse relay list according to NIP-65 format
              const relayMap = parseRelayList(event);
              
              // Extract URLs from the relay map
              const relayUrls = Array.from(relayMap.keys());
              
              // Clean up and resolve
              this.service.unsubscribe(subId);
              clearTimeout(timeoutId);
              resolved = true;
              resolve(relayUrls);
            }
          }
        );
        
        // Set timeout for fallback logic
        timeoutId = setTimeout(() => {
          if (!resolved) {
            this.service.unsubscribe(subId);
            
            // Fallback to default relays if no NIP-65 event found
            const defaultRelays = [
              'wss://relay.damus.io',
              'wss://nostr.bitcoiner.social',
              'wss://relay.nostr.band',
              'wss://nos.lol'
            ];
            console.log(`No relay list found for ${pubkey}, using fallback relays`);
            resolve(defaultRelays);
          }
        }, 5000); // 5 second timeout for relay response
      });
    } catch (error) {
      console.error("Error fetching user relays:", error);
      
      // Fallback to default relays in case of error
      return [
        'wss://relay.damus.io',
        'wss://nostr.bitcoiner.social',
        'wss://relay.nostr.band',
        'wss://nos.lol'
      ];
    }
  }
  
  /**
   * Connect to default relays from configuration
   */
  async connectToDefaultRelays() {
    return this.service.connectToUserRelays(); // Using existing method
  }
  
  /**
   * Connect to user's relays
   */
  async connectToUserRelays() {
    return this.service.connectToUserRelays();
  }
  
  /**
   * Add multiple relays at once, with improved error handling
   * @param relayUrls Array of relay URLs to add
   * @returns Promise resolving to number of successfully added relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    if (!relayUrls || !relayUrls.length) return 0;
    
    let successCount = 0;
    const failedRelays: string[] = [];
    
    for (const url of relayUrls) {
      try {
        const success = await this.addRelay(url);
        if (success) {
          successCount++;
        } else {
          failedRelays.push(url);
        }
      } catch (error) {
        console.error(`Failed to add relay ${url}:`, error);
        failedRelays.push(url);
      }
    }
    
    // Notify user about failed relays if any
    if (failedRelays.length > 0 && successCount > 0) {
      console.warn(`Failed to add ${failedRelays.length} relays:`, failedRelays);
    }
    
    return successCount;
  }
  
  /**
   * Publish user's relay list according to NIP-65
   * @param relays Array of relay objects
   * @returns Promise resolving to boolean indicating success
   */
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    try {
      // Create relay list event according to NIP-65
      const event = {
        kind: 10002, // Relay List Metadata
        content: '', // NIP-65 specifies empty content
        tags: relays.map(relay => {
          // Format: ["r", <relay-url>, <read-marker?>, <write-marker?>]
          const tag = ['r', relay.url];
          if (relay.read) tag.push('read');
          if (relay.write) tag.push('write');
          return tag;
        })
      };
      
      // Use the service method to publish the event directly
      const eventId = await this.service.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing relay list:", error);
      return false;
    }
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
