
import { SimplePool } from 'nostr-tools';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { verifyNip05, fetchNip05Data } from '../nip05';

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
    [key: string]: any;
  } | null> {
    if (!pubkey) return null;
    
    try {
      const connectedRelays = this.getConnectedRelayUrls();
      
      return new Promise((resolve) => {
        const subscribe = (filters: any, onEvent: (event: NostrEvent) => void): string => {
          return this.pool.subscribe(connectedRelays, filters, {
            onevent: onEvent
          }).sub;
        };
        
        const unsubscribe = (subId: string): void => {
          const sub = this.pool.subscriptions.get(subId);
          if (sub) sub.close();
        };
        
        const subId = subscribe(
          {
            kinds: [EVENT_KINDS.META],
            authors: [pubkey],
            limit: 1
          },
          (event) => {
            try {
              const profile = JSON.parse(event.content);
              // Store the raw event tags for NIP-39 verification
              if (Array.isArray(event.tags) && event.tags.length > 0) {
                profile.tags = event.tags;
              }
              resolve(profile);
              
              // Cleanup subscription after receiving the profile
              setTimeout(() => {
                unsubscribe(subId);
              }, 100);
            } catch (e) {
              console.error("Error parsing profile:", e);
              resolve(null);
            }
          }
        );
        
        // Set a timeout to resolve with null if no profile is found
        setTimeout(() => {
          unsubscribe(subId);
          resolve(null);
        }, 5000);
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
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
    const pubkey = await verifyNip05(identifier);
    return pubkey !== null && pubkey === expectedPubkey;
  }

  /**
   * Fetch additional data associated with a NIP-05 identifier
   * @param identifier - NIP-05 identifier in the format username@domain.com
   * @returns NIP-05 data including relays
   */
  async fetchNip05Data(identifier: string): Promise<{
    relays?: Record<string, { read: boolean; write: boolean }>;
    [key: string]: any;
  } | null> {
    return fetchNip05Data(identifier);
  }
}
