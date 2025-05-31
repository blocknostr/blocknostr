import { getEventHash, validateEvent, SimplePool, finalizeEvent, type Event as NostrToolsEvent, type UnsignedEvent, getPublicKey, nip19, Filter, nip04 } from 'nostr-tools';
import { NostrEvent } from './types';
import { EVENT_KINDS } from './constants';

export class EventManager {
  async publishEvent(
    pool: SimplePool,
    event: any,
    relays: string[],
    privateKey?: string
  ): Promise<{ success: boolean; event?: any; error?: string }> {
    try {
      // Check if we have wallet extension available
      const hasWalletExtension = typeof window !== 'undefined' && 
                                (window as any).nostr && 
                                typeof (window as any).nostr.signEvent === 'function';
      
      if (!privateKey && !hasWalletExtension) {
        return { 
          success: false, 
          error: 'Private key or Nostr wallet extension is required for publishing. Please install a Nostr extension like Alby, nos2x, or Flamingo.' 
        };
      }

      if (!event.pubkey) {
        return { success: false, error: 'Public key is required in event' };
      }

      if (!relays || relays.length === 0) {
        return { success: false, error: 'At least one relay is required for publishing' };
      }

      // Set created_at if not provided
      if (!event.created_at) {
        event.created_at = Math.floor(Date.now() / 1000);
      }

      console.log('[EventManager] Publishing event to relays:', relays);
      console.log('[EventManager] Event details:', {
        kind: event.kind,
        content: event.content?.slice(0, 100),
        tags: event.tags,
        pubkey: event.pubkey?.slice(0, 8) + '...'
      });

      let signedEvent;
      
      if (privateKey) {
        // Use private key signing (for server-side or testing)
        console.log('[EventManager] Using private key signing');
        signedEvent = finalizeEvent(event, privateKey);
      } else {
        // Use wallet extension signing
        console.log('[EventManager] Using wallet extension signing');
        try {
          signedEvent = await (window as any).nostr.signEvent(event);
          console.log('[EventManager] Event signed by wallet extension');
        } catch (walletError) {
          console.error('[EventManager] Wallet signing failed:', walletError);
          return { 
            success: false, 
            error: `Wallet signing failed: ${walletError.message || 'User rejected or wallet error'}` 
          };
        }
      }
      
      if (!signedEvent || !signedEvent.sig) {
        return { success: false, error: 'Failed to sign event' };
      }
      
      console.log('[EventManager] Event signed successfully, publishing to', relays.length, 'relays');
      
      // Publish to all relays with error handling
      const publishResults = await Promise.allSettled(
        relays.map(async (relay) => {
          try {
            console.log(`[EventManager] Publishing to relay: ${relay}`);
            await pool.publish([relay], signedEvent);
            console.log(`[EventManager] Successfully published to: ${relay}`);
            return { relay, success: true };
          } catch (error) {
            console.error(`[EventManager] Failed to publish to ${relay}:`, error);
            return { relay, success: false, error };
          }
        })
      );
      
      // Check results
      const successful = publishResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failed = publishResults.length - successful;
      
      console.log(`[EventManager] Publish results: ${successful}/${relays.length} relays successful`);
      
      if (successful === 0) {
        return { 
          success: false, 
          error: `Failed to publish to any relays (${failed}/${relays.length} failed)` 
        };
      }
      
      if (failed > 0) {
        console.warn(`[EventManager] Published to ${successful}/${relays.length} relays (${failed} failed)`);
      }
      
      return { 
        success: true, 
        event: signedEvent,
        publishStats: { successful, failed, total: relays.length }
      };
    } catch (error) {
      console.error('[EventManager] Error publishing event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred while publishing' 
      };
    }
  }

  async queryEvents(
    pool: SimplePool,
    filters: Filter[],
    relays: string[],
    timeout: number = 5000
  ): Promise<any[]> {
    return new Promise((resolve) => {
      const events: any[] = [];
      
      try {
        const subscription = pool.subscribeMany(relays, filters, {
          onevent: (event) => {
            events.push(event);
          },
          onclose: () => {
            resolve(events);
          }
        });

        // Close subscription after timeout
        setTimeout(() => {
          subscription.close();
          resolve(events);
        }, timeout);
      } catch (error) {
        console.error('Error querying events:', error);
        resolve([]);
      }
    });
  }

  async getEventById(
    pool: SimplePool,
    eventId: string,
    relays: string[]
  ): Promise<any | null> {
    try {
      const filter = { ids: [eventId] };
      const events = await this.queryEvents(pool, [filter], relays);
      return events.length > 0 ? events[0] : null;
    } catch (error) {
      console.error(`Error getting event ${eventId}:`, error);
      return null;
    }
  }

  async getEventsByAuthor(
    pool: SimplePool,
    pubkey: string,
    relays: string[],
    kinds: number[] = [1],
    limit: number = 50
  ): Promise<any[]> {
    try {
      const filter = { 
        authors: [pubkey], 
        kinds, 
        limit 
      };
      return await this.queryEvents(pool, [filter], relays);
    } catch (error) {
      console.error(`Error getting events for author ${pubkey}:`, error);
      return [];
    }
  }

  async getEventsByHashtag(
    pool: SimplePool,
    hashtag: string,
    relays: string[],
    limit: number = 50
  ): Promise<any[]> {
    try {
      const filter = { 
        kinds: [1], 
        '#t': [hashtag], 
        limit 
      };
      return await this.queryEvents(pool, [filter], relays);
    } catch (error) {
      console.error(`Error getting events for hashtag ${hashtag}:`, error);
      return [];
    }
  }

  async getContactList(
    pool: SimplePool,
    pubkey: string,
    relays: string[]
  ): Promise<string[]> {
    try {
      const filter = { 
        authors: [pubkey], 
        kinds: [EVENT_KINDS.CONTACT_LIST], 
        limit: 1 
      };
      const events = await this.queryEvents(pool, [filter], relays);
      
      if (events.length === 0) return [];
      
      const contactEvent = events[0];
      return contactEvent.tags
        .filter((tag: string[]) => tag[0] === 'p')
        .map((tag: string[]) => tag[1]);
    } catch (error) {
      console.error(`Error getting contact list for ${pubkey}:`, error);
      return [];
    }
  }

  async publishContactList(
    pool: SimplePool,
    contacts: string[],
    relays: string[],
    privateKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tags = contacts.map(pubkey => ['p', pubkey]);
      
      const event = {
        kind: EVENT_KINDS.CONTACT_LIST,
        tags,
        content: '',
        created_at: Math.floor(Date.now() / 1000),
        pubkey: nip19.decode(privateKey).data as string
      };

      return await this.publishEvent(pool, event, relays, privateKey);
    } catch (error) {
      console.error('Error publishing contact list:', error);
      return { success: false, error: error.message };
    }
  }

  async reactToEvent(
    pool: SimplePool,
    eventId: string,
    authorPubkey: string,
    reaction: string,
    relays: string[],
    privateKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const event = {
        kind: EVENT_KINDS.REACTION,
        tags: [
          ['e', eventId],
          ['p', authorPubkey]
        ],
        content: reaction,
        created_at: Math.floor(Date.now() / 1000),
        pubkey: nip19.decode(privateKey).data as string
      };

      return await this.publishEvent(pool, event, relays, privateKey);
    } catch (error) {
      console.error('Error reacting to event:', error);
      return { success: false, error: error.message };
    }
  }

  async repostEvent(
    pool: SimplePool,
    eventId: string,
    authorPubkey: string,
    comment: string,
    relays: string[],
    privateKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const event = {
        kind: EVENT_KINDS.REPOST,
        tags: [
          ['e', eventId],
          ['p', authorPubkey]
        ],
        content: comment,
        created_at: Math.floor(Date.now() / 1000),
        pubkey: nip19.decode(privateKey).data as string
      };

      return await this.publishEvent(pool, event, relays, privateKey);
    } catch (error) {
      console.error('Error reposting event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish profile metadata according to NIP-01
   * Creates a kind 0 event with user metadata
   */
  async publishProfileMetadata(
    pool: SimplePool,
    publicKey: string | null,
    privateKey: string | null,
    metadata: Record<string, any>,
    relays: string[]
  ): Promise<boolean> {
    try {
      if (!publicKey) {
        console.error('[EventManager] Cannot publish profile metadata: No public key');
        return false;
      }

      if (!relays || relays.length === 0) {
        console.error('[EventManager] Cannot publish profile metadata: No relays provided');
        return false;
      }

      console.log('[EventManager] Publishing profile metadata:', metadata);

      // Create NIP-01 compliant metadata event (kind 0)
      const event = {
        kind: EVENT_KINDS.METADATA, // 0 - User metadata according to NIP-01
        content: JSON.stringify(metadata),
        tags: [], // No tags needed for metadata events according to NIP-01
        created_at: Math.floor(Date.now() / 1000),
        pubkey: publicKey
      };

      console.log('[EventManager] Profile metadata event created:', {
        kind: event.kind,
        contentLength: event.content.length,
        pubkey: event.pubkey.slice(0, 8) + '...',
        relayCount: relays.length
      });

      // Publish the event
      const result = await this.publishEvent(pool, event, relays, privateKey);
      
      if (result.success) {
        console.log('[EventManager] Profile metadata published successfully');
        return true;
      } else {
        console.error('[EventManager] Failed to publish profile metadata:', result.error);
        return false;
      }
    } catch (error) {
      console.error('[EventManager] Error publishing profile metadata:', error);
      return false;
    }
  }

  /**
   * Get user's followers
   */
  async getFollowers(pubkey: string): Promise<string[]> {
    try {
      const events = await this.pool.querySync(this.relayUrls, {
        kinds: [3],
        '#p': [pubkey],
        limit: 1000
      });

      const followers = new Set<string>();
      events.forEach(event => {
        followers.add(event.pubkey);
      });

      return Array.from(followers);
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  /**
   * Get user's following list
   */
  async getFollowing(pubkey: string): Promise<string[]> {
    try {
      const events = await this.pool.querySync(this.relayUrls, {
        kinds: [3],
        authors: [pubkey],
        limit: 1
      });

      if (events.length === 0) return [];

      const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
      const following: string[] = [];

      latestEvent.tags.forEach(tag => {
        if (tag[0] === 'p' && tag[1]) {
          following.push(tag[1]);
        }
      });

      return following;
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }
}

export const localEventManager = new EventManager();

