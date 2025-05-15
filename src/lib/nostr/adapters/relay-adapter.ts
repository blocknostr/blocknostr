
import { BaseAdapter } from './base-adapter';
import { parseRelayList } from '../utils/nip';
import { toast } from 'sonner';
import { relaySelector } from '../relay/selection/relay-selector';
import { circuitBreaker, CircuitState } from '../relay/circuit/circuit-breaker';

// Max number of initial relays for faster loading
const MAX_INITIAL_RELAYS = 4;

// Timeout for initial connection attempts
const CONNECTION_TIMEOUT_MS = 2500; // 2.5 seconds

/**
 * Adapter for relay operations
 * Implements NIP-65 (Relay List Metadata) for relay management
 */
export class RelayAdapter extends BaseAdapter {
  private readonly DEFAULT_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol", 
    "wss://relay.nostr.band",
    "wss://relay.snort.social",
    "wss://purplepag.es"
  ];
  
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
          },
          // Fix: Pass a proper error handler function instead of using it as an additional parameter
          // The third parameter should be the onError callback, not relays
          (error) => {
            console.warn("Error fetching relays for user:", error);
            // We don't resolve here - let the timeout handle it
          }
        );
        
        // Set timeout for fallback logic - reduced from 3s to 2.5s
        timeoutId = setTimeout(() => {
          if (!resolved) {
            this.service.unsubscribe(subId);
            
            // Fallback to default relays if no NIP-65 event found
            console.log(`No relay list found for ${pubkey}, using fallback relays`);
            resolve(this.DEFAULT_RELAYS);
          }
        }, 2500); // Reduced from 3s to 2.5s for faster response
      });
    } catch (error) {
      console.error("Error fetching user relays:", error);
      
      // Fallback to default relays in case of error
      return this.DEFAULT_RELAYS;
    }
  }
  
  /**
   * Connect to default relays from configuration
   */
  async connectToDefaultRelays() {
    try {
      // Select the most reliable relays from our defaults
      const relaysToConnect = relaySelector.getBalancedRelaySet(
        this.DEFAULT_RELAYS, 
        4
      );
      
      return await this.addMultipleRelays(relaysToConnect);
    } catch (error) {
      console.error("Error connecting to default relays:", error);
      return false;
    }
  }
  
  /**
   * Connect to user's relays with improved connection strategy
   * - Starts with a limited set of high-performing relays
   * - Uses timeout to avoid waiting too long
   * - Adds more relays in background after initial content is loaded
   */
  async connectToUserRelays() {
    try {
      // Get all available relays
      const availableRelays = this.service.getRelayUrls();
      
      if (!availableRelays || availableRelays.length === 0) {
        console.log('No relays configured, using default relays.');
        return this.connectToDefaultRelays();
      }
      
      // Filter out relays with open circuit breakers
      const healthyRelays = availableRelays.filter(url => {
        const state = circuitBreaker.getState(url);
        return state !== CircuitState.OPEN;
      });
      
      // If we have no healthy relays, reset some circuit breakers
      if (healthyRelays.length === 0) {
        console.log('All relays have open circuit breakers, resetting defaults');
        this.DEFAULT_RELAYS.forEach(url => {
          if (availableRelays.includes(url)) {
            circuitBreaker.reset(url);
          }
        });
      }
      
      // Select relays to use - prioritize healthy ones, fallback to all
      const relaysToUse = healthyRelays.length > 0 ? healthyRelays : availableRelays;
      
      // Sort relays for optimal connection order
      const sortedRelays = relaySelector.getBalancedRelaySet(relaysToUse, MAX_INITIAL_RELAYS);
      
      console.log(`Connecting to ${sortedRelays.length} initial relays:`, sortedRelays);
      
      // Connect to initial relays with timeout
      const initialConnectionPromise = Promise.race([
        // Attempt to connect to initial relays
        this.service.relayManager.addMultipleRelays(sortedRelays),
        
        // Timeout after 2.5 seconds to avoid waiting too long
        new Promise<number>((resolve) => {
          setTimeout(() => {
            console.log(`Connection timeout reached after ${CONNECTION_TIMEOUT_MS}ms`);
            resolve(0);
          }, CONNECTION_TIMEOUT_MS);
        })
      ]);
      
      // Wait for initial connections
      const connectedCount = await initialConnectionPromise;
      console.log(`Connected to ${connectedCount} initial relays`);
      
      // If we have remaining relays, connect to them in the background
      if (availableRelays.length > MAX_INITIAL_RELAYS) {
        const remainingRelays = availableRelays.filter(url => !sortedRelays.includes(url));
        
        // Connect to remaining relays in the background
        setTimeout(() => {
          console.log(`Connecting to ${remainingRelays.length} additional relays in background`);
          this.service.relayManager.addMultipleRelays(remainingRelays).then((count) => {
            console.log(`Connected to ${count} additional relays`);
          });
        }, 100);
      }
      
      return connectedCount > 0;
    } catch (error) {
      console.error('Error connecting to relays:', error);
      return false;
    }
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
    
    // Filter out relays with open circuit breakers
    const filteredRelays = relayUrls.filter(url => {
      const state = circuitBreaker.getState(url);
      if (state === CircuitState.OPEN) {
        console.log(`Skipping relay ${url} due to open circuit breaker`);
        return false;
      }
      return true;
    });
    
    // Use Promise.allSettled for parallel connection attempts with faster timeouts
    const connectionPromises = filteredRelays.map(url => {
      return Promise.race([
        this.addRelay(url).then(success => {
          if (success) {
            successCount++;
            // Reset failures or record success in circuit breaker
            circuitBreaker.recordSuccess(url);
            return { url, success: true };
          } else {
            failedRelays.push(url);
            // Record failure in circuit breaker
            circuitBreaker.recordFailure(url);
            return { url, success: false };
          }
        }).catch(error => {
          console.warn(`Error connecting to relay ${url}:`, error);
          failedRelays.push(url);
          // Record failure in circuit breaker
          circuitBreaker.recordFailure(url);
          return { url, success: false };
        }),
        // Individual timeout per relay to avoid slow relays blocking everything
        new Promise<{url: string, success: false}>(resolve => {
          setTimeout(() => {
            failedRelays.push(url);
            // Record timeout failure in circuit breaker
            circuitBreaker.recordFailure(url);
            resolve({ url, success: false });
          }, 2000); // 2 second timeout per relay
        })
      ]);
    });
    
    await Promise.allSettled(connectionPromises);
    
    // Notify user about failed relays if any (only if many failures)
    if (failedRelays.length > 3 && successCount === 0) {
      console.warn(`Failed to add ${failedRelays.length} relays:`, failedRelays);
      // Only show toast if no relays connected successfully
      toast.error("Failed to connect to relays. Check your network connection.");
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
      
      const eventId = await this.service.publishEvent(event);
      return !!eventId;
    } catch (error) {
      console.error("Error publishing relay list:", error);
      return false;
    }
  }
  
  /**
   * Get relays with their capabilities from the relay info service
   * @returns Promise resolving to array of relay info objects
   */
  async getRelayInfos(relayUrls: string[]) {
    // This method could be expanded to fetch detailed relay info
    // Currently a placeholder for future enhancement
    return Promise.all(
      relayUrls.map(async url => {
        try {
          return {
            url,
            info: await this.relayManager.getRelayInformation(url)
          };
        } catch (error) {
          return { url, info: null };
        }
      })
    );
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
}
