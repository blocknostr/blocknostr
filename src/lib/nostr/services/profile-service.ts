import { SimplePool, Filter } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { verifyNip05, fetchNip05Data } from '../utils/nip';

/**
 * Profile service that handles user profile-related methods
 */
export class ProfileService {
  constructor(private pool: SimplePool, private getConnectedRelayUrls: () => string[]) {}

  /**
   * Add getUserProfile method with improved implementation
   * Complies with NIP-01 for metadata retrieval
   */
  async getUserProfile(pubkey: string): Promise<{
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
    banner?: string;
    website?: string;
    lud16?: string;
    created_at?: number;
    [key: string]: any;
  } | null> {
    if (!pubkey) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        // Properly construct a single filter object according to nostr-tools Filter type
        const filter: Filter = {
          kinds: [EVENT_KINDS.META],
          authors: [pubkey],
          limit: 1
        };
        
        let subscription: { close: () => void } | null = null;
        
        try {
          subscription = this.pool.subscribe(
            connectedRelays,
            filter,
            {
              onevent: (event) => {
                try {
                  const profile = JSON.parse(event.content);
                  
                  // Store the raw event data for later use
                  profile._event = {
                    id: event.id,
                    created_at: event.created_at
                  };
                  
                  // Store the raw event tags for NIP-39 verification
                  if (Array.isArray(event.tags) && event.tags.length > 0) {
                    profile.tags = event.tags;
                  }
                  
                  resolve(profile);
                  
                  // Cleanup subscription after receiving the profile
                  setTimeout(() => {
                    if (subscription) {
                      subscription.close();
                    }
                  }, 100);
                } catch (e) {
                  console.error("Error parsing profile:", e);
                  resolve(null);
                }
              }
            }
          );
        } catch (error) {
          console.error("Error in subscription:", error);
          resolve(null);
        }
        
        // Set a timeout to resolve with null if no profile is found
        setTimeout(() => {
          if (subscription) {
            subscription.close();
          }
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  /**
   * Fetch user's oldest metadata event to determine account creation date (NIP-01)
   * @param pubkey User's public key
   * @returns Timestamp of the oldest metadata event or null
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    if (!pubkey) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        // Construct filter to get oldest metadata events
        const filter: Filter = {
          kinds: [EVENT_KINDS.META],
          authors: [pubkey],
          limit: 10,
          // Query for historical events
          until: Math.floor(Date.now() / 1000)
        };
        
        let subscription: { close: () => void } | null = null;
        let events: NostrEvent[] = [];
        
        try {
          subscription = this.pool.subscribe(
            connectedRelays,
            filter,
            {
              onevent: (event) => {
                events.push(event);
              },
              onclose: () => {
                // On end of subscription, process and resolve
                if (events.length > 0) {
                  // Sort by creation time (oldest first)
                  events.sort((a, b) => a.created_at - b.created_at);
                  resolve(events[0].created_at);
                } else {
                  resolve(null);
                }
              }
            }
          );
        } catch (error) {
          console.error("Error in subscription:", error);
          resolve(null);
        }
        
        // Set a timeout to resolve with null if no events found
        setTimeout(() => {
          if (subscription) {
            subscription.close();
          }
          
          if (events.length > 0) {
            events.sort((a, b) => a.created_at - b.created_at);
            resolve(events[0].created_at);
          } else {
            resolve(null);
          }
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching account creation date:", error);
      return null;
    }
  }

  /**
   * Verify a NIP-05 identifier and check if it matches the expected pubkey
   * @param identifier - NIP-05 identifier in the format username@domain.com
   * @param expectedPubkey - The pubkey that should match the NIP-05 identifier
   * @returns True if the NIP-05 identifier resolves to the expected pubkey
   */
  async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    return verifyNip05(identifier, expectedPubkey);
  }

  /**
   * Fetch additional data associated with a NIP-05 identifier
   * @param identifier - NIP-05 identifier in the format username@domain.com
   * @returns NIP-05 data including relays
   */
  async fetchNip05Data(identifier: string): Promise<{
    pubkey?: string;
    relays?: Record<string, { read: boolean; write: boolean }>;
    [key: string]: any;
  } | null> {
    return fetchNip05Data(identifier);
  }
}
