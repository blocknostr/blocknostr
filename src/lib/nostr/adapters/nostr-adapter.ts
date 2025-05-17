
import { nostrService } from '../service';
import { BaseAdapter } from './base-adapter';
import { SocialAdapter } from './social-adapter';
import { RelayAdapter } from './relay-adapter';
import { DataAdapter } from './data-adapter';
import { CommunityAdapter } from './community-adapter';
import { Event, Filter } from 'nostr-tools';

/**
 * Main NostrAdapter that implements all functionality through composition
 * This ensures all components continue to work without changing their implementation
 */
export class NostrAdapter extends BaseAdapter {
  private socialAdapter: SocialAdapter;
  private relayAdapter: RelayAdapter;
  private dataAdapter: DataAdapter;
  private communityAdapter: CommunityAdapter;
  
  constructor(service: typeof nostrService) {
    super(service);
    
    // Initialize all the adapters
    this.socialAdapter = new SocialAdapter(service);
    this.relayAdapter = new RelayAdapter(service);
    this.dataAdapter = new DataAdapter(service);
    this.communityAdapter = new CommunityAdapter(service);
  }

  // Forward methods to appropriate adapters
  
  // Social methods
  isFollowing(pubkey: string) {
    return this.socialAdapter.isFollowing(pubkey);
  }
  
  async followUser(pubkey: string) {
    return this.socialAdapter.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string) {
    return this.socialAdapter.unfollowUser(pubkey);
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.socialAdapter.sendDirectMessage(recipientPubkey, content);
  }

  // User moderation methods
  async muteUser(pubkey: string) {
    return this.socialAdapter.muteUser(pubkey);
  }
  
  async unmuteUser(pubkey: string) {
    return this.socialAdapter.unmuteUser(pubkey);
  }
  
  async isUserMuted(pubkey: string) {
    return this.socialAdapter.isUserMuted(pubkey);
  }
  
  async blockUser(pubkey: string) {
    return this.socialAdapter.blockUser(pubkey);
  }
  
  async unblockUser(pubkey: string) {
    return this.socialAdapter.unblockUser(pubkey);
  }
  
  async isUserBlocked(pubkey: string) {
    return this.socialAdapter.isUserBlocked(pubkey);
  }
  
  // Add missing methods for DAO implementation
  signEvent(event: Partial<Event>): Event {
    // Using service directly 
    if (typeof this.service.signEvent === 'function') {
      return this.service.signEvent(event as any);
    }
    throw new Error("signEvent method is not available on the service");
  }
  
  subscribeToEvents(filters: Filter | Filter[], relays: string[], callbacks: { onevent: (event: any) => void; onclose: () => void }) {
    try {
      // Check if the pool is available
      if (typeof this.service.getPool !== 'function') {
        console.error("getPool method is not available on the service");
        return {
          unsubscribe: () => {}
        };
      }
      
      const pool = this.service.getPool();
      if (!pool) {
        console.error("Pool is not available");
        return {
          unsubscribe: () => {}
        };
      }
      
      // Make sure the pool has a sub method
      if (typeof pool.sub !== 'function') {
        console.error("Pool does not have a sub method");
        return {
          unsubscribe: () => {}
        };
      }
      
      const sub = pool.sub(relays, filters);
      
      // Set up event handlers
      sub.on('event', (event: any) => {
        callbacks.onevent(event);
      });
      
      sub.on('eose', () => {
        // End of stored events
      });
      
      // Return a valid unsubscribe function
      return {
        unsubscribe: () => {
          if (sub && typeof sub.unsub === 'function') {
            sub.unsub();
          }
        }
      };
    } catch (error) {
      console.error("Error in subscribeToEvents:", error);
      // Return a no-op unsubscribe function to avoid runtime errors
      return {
        unsubscribe: () => {}
      };
    }
  }
  
  // Manager getters
  get socialManager() {
    return this.socialAdapter.socialManager;
  }
  
  get relayManager() {
    return this.relayAdapter.relayManager;
  }
  
  get communityManager() {
    return this.communityAdapter.communityManager;
  }
  
  // Add utility method to access pool
  get pool() {
    if (typeof this.service.getPool !== 'function') {
      throw new Error("getPool method is not available on the service");
    }
    return this.service.getPool();
  }
}
