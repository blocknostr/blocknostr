
import { SimplePool } from 'nostr-tools';
import { NostrEvent, Relay } from './types';
import { NostrService } from './service';

/**
 * Adapter for NostrService that provides missing methods for compatibility
 */
export class NostrAdapter {
  private pool: SimplePool;
  private publicKey: string | null = null;
  private _relays: Relay[] = [];
  
  constructor() {
    this.pool = new SimplePool();
  }
  
  // User authentication methods
  login = async () => {
    console.log("Login called");
    return true;
  }
  
  signOut = async () => {
    console.log("Sign out called");
    this.publicKey = null;
    return true;
  }
  
  // Key formatting methods
  formatPubkey = (pubkey: string, format: 'short' | 'medium' | 'full' = 'short'): string => {
    if (!pubkey) return '';
    
    if (format === 'short') {
      return pubkey.slice(0, 5) + '...' + pubkey.slice(-5);
    } else if (format === 'medium') {
      return pubkey.slice(0, 8) + '...' + pubkey.slice(-8);
    }
    
    return pubkey;
  }
  
  getNpubFromHex = (hex: string): string => {
    return `npub${hex.substring(0, 10)}`;
  }
  
  getHexFromNpub = (npub: string): string => {
    return npub.startsWith('npub') ? npub.substring(4) : npub;
  }

  // Add the missing getHexFromNote method
  getHexFromNote = (noteId: string): string => {
    // If it starts with note1 (bech32 format), convert to hex
    // This is a simplified implementation - real code would use proper bech32 conversion
    return noteId.startsWith('note1') ? noteId.substring(5) : noteId;
  }
  
  // Following methods
  isFollowing = async (pubkey: string): Promise<boolean> => {
    console.log(`Checking if following ${pubkey}`);
    return false;
  }
  
  followUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Following user ${pubkey}`);
    return true;
  }
  
  unfollowUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Unfollowing user ${pubkey}`);
    return true;
  }
  
  // User moderation methods
  muteUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Muting user ${pubkey}`);
    return true;
  }
  
  unmuteUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Unmuting user ${pubkey}`);
    return true;
  }
  
  blockUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Blocking user ${pubkey}`);
    return true;
  }
  
  unblockUser = async (pubkey: string): Promise<boolean> => {
    console.log(`Unblocking user ${pubkey}`);
    return true;
  }
  
  isUserMuted = async (pubkey: string): Promise<boolean> => {
    return false;
  }
  
  isUserBlocked = async (pubkey: string): Promise<boolean> => {
    return false;
  }
  
  // Direct messaging
  sendDirectMessage = async (recipientPubkey: string, message: string): Promise<boolean> => {
    console.log(`Sending DM to ${recipientPubkey}`);
    return true;
  }
  
  // Community methods
  createCommunity = async (name: string, description: string): Promise<boolean> => {
    console.log(`Creating community ${name}`);
    return true;
  }
  
  createProposal = async (communityId: string, title: string, description: string): Promise<boolean> => {
    console.log(`Creating proposal for community ${communityId}`);
    return true;
  }
  
  voteOnProposal = async (proposalId: string, vote: 'yes' | 'no'): Promise<boolean> => {
    console.log(`Voting ${vote} on proposal ${proposalId}`);
    return true;
  }
  
  // Relay management
  addRelay = async (url: string): Promise<boolean> => {
    this._relays.push({
      url,
      read: true,
      write: true,
      status: 'connecting'
    });
    console.log(`Added relay ${url}`);
    return true;
  }
  
  removeRelay = async (url: string): Promise<boolean> => {
    this._relays = this._relays.filter(r => r.url !== url);
    console.log(`Removed relay ${url}`);
    return true;
  }
  
  getRelaysForUser = async (pubkey: string): Promise<Relay[]> => {
    return [
      { url: "wss://relay.damus.io", read: true, write: true, status: 'connected' },
      { url: "wss://nos.lol", read: true, write: true, status: 'connected' }
    ];
  }
  
  // Access properties
  get following(): string[] {
    return [];
  }
  
  get relays(): Relay[] {
    return this._relays;
  }
  
  // Add missing subscribeToEvents method
  subscribeToEvents = (filters: any[], relays: string[], callbacks: { onevent: (event: any) => void; onclose: () => void }) => {
    const sub = 'subscription-' + Math.random().toString(36).substring(2, 10);
    console.log(`Subscribing to events with filters:`, filters);
    setTimeout(() => {
      callbacks.onclose();
    }, 5000);
    return {
      sub,
      unsubscribe: () => console.log(`Unsubscribing from ${sub}`)
    };
  }
  
  unsubscribe = (subId: string) => {
    console.log(`Unsubscribing from ${subId}`);
  }
  
  // NIP-65 relay list publishing (needed for ProfileRelaysDialog)
  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    console.log(`Publishing relay list with ${relays.length} relays`);
    return true;
  }
}

// Create and export an instance of NostrAdapter
export const adaptedNostrService = new NostrAdapter();
