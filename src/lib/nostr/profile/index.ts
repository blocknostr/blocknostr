
import { SimplePool } from 'nostr-tools';
import { EventManager } from '../event';
import { EVENT_KINDS } from '../constants';

/**
 * Handles user profile interactions in the Nostr protocol
 * Implements NIP-01 (metadata events) and related functionality
 */
export class ProfileManager {
  private eventManager: EventManager;
  
  constructor(eventManager: EventManager) {
    this.eventManager = eventManager;
  }
  
  /**
   * Fetch user profile metadata
   * Uses kind 0 events according to NIP-01
   */
  async getUserProfile(
    pool: SimplePool,
    pubkey: string,
    relayUrls: string[]
  ): Promise<Record<string, any> | null> {
    if (!pubkey) return null;
    
    try {
      // Query for kind 0 metadata events
      const events = await pool.list(relayUrls, [
        {
          kinds: [EVENT_KINDS.METADATA],
          authors: [pubkey],
          limit: 1
        }
      ]);
      
      if (!events || events.length === 0) {
        return null;
      }
      
      // Use the most recent metadata event
      const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
      
      try {
        // Parse the content field which contains the profile data in JSON format
        const profileData = JSON.parse(latestEvent.content);
        
        // Add the raw event for reference
        return {
          ...profileData,
          _event: latestEvent
        };
      } catch (e) {
        console.error('Failed to parse profile data:', e);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
  
  /**
   * Update user profile metadata
   * Creates kind 0 event according to NIP-01
   */
  async updateProfile(
    pool: SimplePool,
    pubkey: string | null,
    privateKey: string | null,
    profileData: Record<string, string>,
    relayUrls: string[]
  ): Promise<string | null> {
    if (!pubkey) {
      console.error('Cannot update profile: not logged in');
      return null;
    }
    
    try {
      // Create metadata event (kind 0)
      const event = {
        kind: EVENT_KINDS.METADATA,
        content: JSON.stringify(profileData),
        tags: []
      };
      
      // Publish the event
      return this.eventManager.publishEvent(pool, pubkey, privateKey, event, relayUrls);
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  }
  
  /**
   * Fetch profiles for multiple pubkeys at once
   */
  async getProfilesByPubkeys(
    pool: SimplePool,
    pubkeys: string[],
    relayUrls: string[]
  ): Promise<Record<string, any>> {
    if (!pubkeys || pubkeys.length === 0) {
      return {};
    }
    
    try {
      // Query for kind 0 metadata events for all pubkeys
      const events = await pool.list(relayUrls, [
        {
          kinds: [EVENT_KINDS.METADATA],
          authors: pubkeys
        }
      ]);
      
      if (!events || events.length === 0) {
        return {};
      }
      
      // Group events by author
      const eventsByAuthor: Record<string, any[]> = {};
      events.forEach(event => {
        if (!eventsByAuthor[event.pubkey]) {
          eventsByAuthor[event.pubkey] = [];
        }
        eventsByAuthor[event.pubkey].push(event);
      });
      
      // For each author, use the most recent metadata event
      const profiles: Record<string, any> = {};
      Object.keys(eventsByAuthor).forEach(pubkey => {
        const authorEvents = eventsByAuthor[pubkey];
        const latestEvent = authorEvents.sort((a, b) => b.created_at - a.created_at)[0];
        
        try {
          const profileData = JSON.parse(latestEvent.content);
          profiles[pubkey] = {
            ...profileData,
            _event: latestEvent
          };
        } catch (e) {
          console.error(`Failed to parse profile data for ${pubkey}:`, e);
        }
      });
      
      return profiles;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return {};
    }
  }
  
  /**
   * Verify NIP-05 identifier for a pubkey
   */
  async verifyNip05(
    identifier: string,
    pubkey: string
  ): Promise<boolean> {
    if (!identifier || !pubkey) return false;
    
    try {
      // Check if identifier has proper format (user@domain.tld)
      if (!identifier.includes('@')) {
        return false;
      }
      
      const [name, domain] = identifier.split('@');
      
      // Fetch NIP-05 well-known file
      const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      
      // Check if pubkey matches
      return data?.names?.[name] === pubkey;
    } catch (error) {
      console.error('Error verifying NIP-05 identifier:', error);
      return false;
    }
  }
}
