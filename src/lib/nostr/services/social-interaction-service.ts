
import { SimplePool, type Filter, type Event } from 'nostr-tools';
import { toast } from 'sonner';
import { NostrEvent } from '../types';
import { EVENT_KINDS } from '../constants';
import { contentCache } from '../cache/content-cache';

export class SocialInteractionService {
  constructor(
    private pool: SimplePool,
    private getPublicKey: () => string | null,
    private getConnectedRelayUrls: () => string[]
  ) {}

  /**
   * Mutes a user following NIP-51 - adds the user to the mute list
   * @param pubkeyToMute The pubkey of the user to mute
   * @returns Whether the operation was successful
   */
  async muteUser(pubkeyToMute: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error("You must be logged in to mute users");
      return false;
    }

    // Prevent muting yourself
    if (pubkeyToMute === currentUserPubkey) {
      toast.error("You cannot mute yourself");
      return false;
    }

    try {
      // Get current mute list
      const muteList = await this.getMuteList();
      
      // Check if already muted
      if (muteList.includes(pubkeyToMute)) {
        return true; // Already muted
      }

      // Add to mute list
      muteList.push(pubkeyToMute);
      
      // Create mute list tags following NIP-51
      const tags = muteList.map(pubkey => ['p', pubkey]);
      tags.push(['d', 'mute-list']); // NIP-51 requires 'd' tag with 'mute-list' value

      // Create and publish the event
      const muteEvent = {
        kind: EVENT_KINDS.MUTE_LIST,
        tags: tags,
        content: '', // NIP-51 lists have empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey // This must be set as required by Event type
      } as Event; // Explicitly cast to Event type to ensure it satisfies the interface

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(muteEvent);
        
        await this.pool.publish(relays, signedEvent as Event); // Cast to Event to satisfy type requirements
        
        // Update local cache
        contentCache.cacheMuteList(muteList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error("Error muting user:", error);
      toast.error("Failed to mute user");
      return false;
    }
  }

  /**
   * Unmutes a user following NIP-51 - removes the user from the mute list
   * @param pubkeyToUnmute The pubkey of the user to unmute
   * @returns Whether the operation was successful
   */
  async unmuteUser(pubkeyToUnmute: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error("You must be logged in to unmute users");
      return false;
    }

    try {
      // Get current mute list
      const muteList = await this.getMuteList();
      
      // Check if not muted
      if (!muteList.includes(pubkeyToUnmute)) {
        return true; // Already unmuted
      }

      // Remove from mute list
      const updatedMuteList = muteList.filter(pubkey => pubkey !== pubkeyToUnmute);
      
      // Create mute list tags following NIP-51
      const tags = updatedMuteList.map(pubkey => ['p', pubkey]);
      tags.push(['d', 'mute-list']); // NIP-51 requires 'd' tag with 'mute-list' value

      // Create and publish the event
      const muteEvent = {
        kind: EVENT_KINDS.MUTE_LIST,
        tags: tags,
        content: '', // NIP-51 lists have empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey // This must be set as required by Event type
      } as Event; // Explicitly cast to Event type

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(muteEvent);
        
        await this.pool.publish(relays, signedEvent as Event); // Cast to Event to satisfy type requirements
        
        // Update local cache
        contentCache.cacheMuteList(updatedMuteList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error("Error unmuting user:", error);
      toast.error("Failed to unmute user");
      return false;
    }
  }

  /**
   * Gets the current mute list for the user
   * @returns Array of pubkeys that are muted
   */
  async getMuteList(): Promise<string[]> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      return [];
    }

    // Check cache first
    const cachedMuteList = contentCache.getMuteList();
    if (cachedMuteList) {
      return cachedMuteList;
    }

    // If not in cache, fetch from relays
    try {
      const relays = this.getConnectedRelayUrls();
      
      // Create a proper Filter object for querySync
      const filter: Filter = {
        kinds: [EVENT_KINDS.MUTE_LIST],
        authors: [currentUserPubkey],
        limit: 1
      };

      // Use querySync with a single filter, not an array of filters
      const events = await this.pool.querySync(relays, filter);

      if (events && events.length > 0) {
        // Extract pubkeys from the 'p' tags
        const mutedPubkeys = events[0].tags
          .filter(tag => tag.length >= 2 && tag[0] === 'p')
          .map(tag => tag[1]);
        
        // Cache the result
        contentCache.cacheMuteList(mutedPubkeys);
        
        return mutedPubkeys;
      }
      
      // If no events found, return empty array
      return [];
    } catch (error) {
      console.error("Error fetching mute list:", error);
      return [];
    }
  }

  /**
   * Checks if a user is muted
   * @param pubkey The pubkey to check
   * @returns True if the user is muted
   */
  async isUserMuted(pubkey: string): Promise<boolean> {
    if (!pubkey) return false;
    
    const muteList = await this.getMuteList();
    return muteList.includes(pubkey);
  }
  
  /**
   * Blocks a user - adds the user to the block list
   * @param pubkeyToBlock The pubkey of the user to block
   * @returns Whether the operation was successful
   */
  async blockUser(pubkeyToBlock: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error("You must be logged in to block users");
      return false;
    }

    // Prevent blocking yourself
    if (pubkeyToBlock === currentUserPubkey) {
      toast.error("You cannot block yourself");
      return false;
    }

    try {
      // Get current block list
      const blockList = await this.getBlockList();
      
      // Check if already blocked
      if (blockList.includes(pubkeyToBlock)) {
        return true; // Already blocked
      }

      // Add to block list
      blockList.push(pubkeyToBlock);
      
      // Create block list tags following NIP-51 pattern
      const tags = blockList.map(pubkey => ['p', pubkey]);
      tags.push(['d', 'block-list']); // Similar to NIP-51 structure

      // Create and publish the event
      const blockEvent = {
        kind: EVENT_KINDS.BLOCK_LIST,
        tags: tags,
        content: '', // Empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey // This must be set as required by Event type
      } as Event; // Explicitly cast to Event type

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(blockEvent);
        
        await this.pool.publish(relays, signedEvent as Event); // Cast to Event to satisfy type requirements
        
        // Update local cache
        contentCache.cacheBlockList(blockList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
      return false;
    }
  }

  /**
   * Unblocks a user - removes the user from the block list
   * @param pubkeyToUnblock The pubkey of the user to unblock
   * @returns Whether the operation was successful
   */
  async unblockUser(pubkeyToUnblock: string): Promise<boolean> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      toast.error("You must be logged in to unblock users");
      return false;
    }

    try {
      // Get current block list
      const blockList = await this.getBlockList();
      
      // Check if not blocked
      if (!blockList.includes(pubkeyToUnblock)) {
        return true; // Already unblocked
      }

      // Remove from block list
      const updatedBlockList = blockList.filter(pubkey => pubkey !== pubkeyToUnblock);
      
      // Create block list tags following NIP-51 pattern
      const tags = updatedBlockList.map(pubkey => ['p', pubkey]);
      tags.push(['d', 'block-list']); // Similar to NIP-51 structure

      // Create and publish the event
      const blockEvent = {
        kind: EVENT_KINDS.BLOCK_LIST,
        tags: tags,
        content: '', // Empty content
        created_at: Math.floor(Date.now() / 1000),
        pubkey: currentUserPubkey // This must be set as required by Event type
      } as Event; // Explicitly cast to Event type

      const relays = this.getConnectedRelayUrls();
      
      // Use the browser extension to sign and publish
      if (window.nostr) {
        const signedEvent = await window.nostr.signEvent(blockEvent);
        
        await this.pool.publish(relays, signedEvent as Event); // Cast to Event to satisfy type requirements
        
        // Update local cache
        contentCache.cacheBlockList(updatedBlockList);
        
        return true;
      } else {
        toast.error("No Nostr extension found");
        return false;
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
      return false;
    }
  }

  /**
   * Gets the current block list for the user
   * @returns Array of pubkeys that are blocked
   */
  async getBlockList(): Promise<string[]> {
    const currentUserPubkey = this.getPublicKey();
    if (!currentUserPubkey) {
      return [];
    }

    // Check cache first
    const cachedBlockList = contentCache.getBlockList();
    if (cachedBlockList) {
      return cachedBlockList;
    }

    // If not in cache, fetch from relays
    try {
      const relays = this.getConnectedRelayUrls();
      
      // Create a proper Filter object for querySync
      const filter: Filter = {
        kinds: [EVENT_KINDS.BLOCK_LIST],
        authors: [currentUserPubkey],
        limit: 1
      };

      // Use querySync with a single filter, not an array of filters
      const events = await this.pool.querySync(relays, filter);

      if (events && events.length > 0) {
        // Extract pubkeys from the 'p' tags
        const blockedPubkeys = events[0].tags
          .filter(tag => tag.length >= 2 && tag[0] === 'p')
          .map(tag => tag[1]);
        
        // Cache the result
        contentCache.cacheBlockList(blockedPubkeys);
        
        return blockedPubkeys;
      }
      
      // If no events found, return empty array
      return [];
    } catch (error) {
      console.error("Error fetching block list:", error);
      return [];
    }
  }

  /**
   * Checks if a user is blocked
   * @param pubkey The pubkey to check
   * @returns True if the user is blocked
   */
  async isUserBlocked(pubkey: string): Promise<boolean> {
    if (!pubkey) return false;
    
    const blockList = await this.getBlockList();
    return blockList.includes(pubkey);
  }
}
