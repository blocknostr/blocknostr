
import { SimplePool } from 'nostr-tools';
import { NostrEvent, NostrProfileMetadata } from '../types';
import { EVENT_KINDS } from '../constants';

/**
 * Service for managing user profiles
 */
export class ProfileService {
  private profileCache: Map<string, NostrProfileMetadata> = new Map();
  
  constructor(
    private pool: SimplePool,
    private getConnectedRelayUrls: () => string[]
  ) {}
  
  /**
   * Get user profile metadata
   */
  async getUserProfile(pubkey: string): Promise<NostrProfileMetadata | null> {
    if (!pubkey) return null;
    
    // Check cache first
    if (this.profileCache.has(pubkey)) {
      return this.profileCache.get(pubkey) || null;
    }
    
    const relays = this.getConnectedRelayUrls();
    if (relays.length === 0) return null;
    
    try {
      const event = await this.pool.get(relays, {
        kinds: [EVENT_KINDS.META],
        authors: [pubkey]
      });
      
      if (!event || !event.content) return null;
      
      try {
        const profileData = JSON.parse(event.content) as NostrProfileMetadata;
        
        // Cache the profile data
        this.profileCache.set(pubkey, profileData);
        
        return profileData;
      } catch (e) {
        console.error('Error parsing profile data:', e);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      return null;
    }
  }
  
  /**
   * Get profiles for multiple users
   */
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, NostrProfileMetadata>> {
    const relays = this.getConnectedRelayUrls();
    if (relays.length === 0 || pubkeys.length === 0) return {};
    
    const profiles: Record<string, NostrProfileMetadata> = {};
    
    // First check cache for any already fetched profiles
    pubkeys.forEach(pubkey => {
      if (this.profileCache.has(pubkey)) {
        profiles[pubkey] = this.profileCache.get(pubkey)!;
      }
    });
    
    // Get remaining pubkeys that aren't in the cache
    const remainingPubkeys = pubkeys.filter(pubkey => !profiles[pubkey]);
    
    if (remainingPubkeys.length === 0) {
      return profiles;
    }
    
    try {
      const events = await this.pool.list(relays, [{
        kinds: [EVENT_KINDS.META],
        authors: remainingPubkeys
      }]);
      
      events.forEach(event => {
        try {
          const profileData = JSON.parse(event.content);
          profiles[event.pubkey] = profileData;
          
          // Update cache
          this.profileCache.set(event.pubkey, profileData);
        } catch (e) {
          console.error(`Error parsing profile for ${event.pubkey}:`, e);
        }
      });
      
      return profiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return profiles;
    }
  }
  
  /**
   * Verify a NIP-05 identifier
   */
  async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    try {
      const [name, domain] = identifier.split('@');
      if (!name || !domain) return false;
      
      const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.names && data.names[name] === expectedPubkey) {
        return true;
      }
      
      return false;
    } catch (e) {
      console.error("Error verifying NIP-05:", e);
      return false;
    }
  }
}
