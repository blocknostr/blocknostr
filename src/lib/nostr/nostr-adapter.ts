import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';
import { nostrService as originalNostrService } from './service';

/**
 * NostrAdapter adds compatibility methods to the original nostrService
 * This ensures all components continue to work without changing their implementation
 */
class NostrAdapter {
  private service: typeof originalNostrService;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
  }

  // Auth methods
  get publicKey() {
    return this.service.publicKey;
  }
  
  get following() {
    return this.service.following;
  }
  
  async login() {
    return this.service.login();
  }
  
  signOut() {
    return this.service.signOut();
  }
  
  // Social methods
  isFollowing(pubkey: string) {
    return this.service.isFollowing(pubkey);
  }
  
  async followUser(pubkey: string) {
    return this.service.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser(pubkey);
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }

  // User moderation methods
  async muteUser(pubkey: string) {
    return this.service.muteUser(pubkey);
  }
  
  async unmuteUser(pubkey: string) {
    return this.service.unmuteUser(pubkey);
  }
  
  async isUserMuted(pubkey: string) {
    return this.service.isUserMuted(pubkey);
  }
  
  async blockUser(pubkey: string) {
    return this.service.blockUser(pubkey);
  }
  
  async unblockUser(pubkey: string) {
    return this.service.unblockUser(pubkey);
  }
  
  async isUserBlocked(pubkey: string) {
    return this.service.isUserBlocked(pubkey);
  }

  // Community methods
  async createCommunity(name: string, description: string) {
    return this.service.createCommunity(name, description);
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    return this.service.createProposal(communityId, title, description, options, category as any);
  }

  // Added missing voteOnProposal method
  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.service.voteOnProposal(proposalId, optionIndex);
  }

  // Utilities
  formatPubkey(pubkey: string) {
    return formatPubkey(pubkey);
  }
  
  getNpubFromHex(hexPubkey: string) {
    return getNpubFromHex(hexPubkey);
  }
  
  getHexFromNpub(npub: string) {
    return getHexFromNpub(npub);
  }
  
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

  // Add getRelayUrls method
  getRelayUrls() {
    return this.service.getRelayUrls();
  }
  
  // Add getRelaysForUser method
  async getRelaysForUser(pubkey: string) {
    return this.service.getRelaysForUser(pubkey);
  }
  
  async connectToDefaultRelays() {
    return this.service.connectToUserRelays();
  }
  
  async connectToUserRelays() {
    return this.service.connectToUserRelays();
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    return this.service.addMultipleRelays(relayUrls);
  }

  // Pass through all other methods directly
  get socialManager() {
    return {
      ...this.service.socialManager,
      likeEvent: (event: any) => {
        return this.service.reactToPost(event.id);
      },
      repostEvent: (event: any) => {
        return this.service.repostNote(event.id, event.pubkey);
      },
      // Add missing getReactionCounts method
      getReactionCounts: (eventId: string) => {
        // Implement a basic version that returns zeros
        return Promise.resolve({
          likes: 0,
          reposts: 0
        });
      },
      // Add missing reactToEvent method
      reactToEvent: (eventId: string, emoji: string = "+") => {
        return this.service.reactToPost(eventId, emoji);
      }
    };
  }
  
  get relayManager() {
    return this.service.relayManager;
  }
  
  get communityManager() {
    return this.service.communityManager;
  }
  
  get bookmarkManager() {
    return this.service.bookmarkManager;
  }

  // Pass through direct method calls
  async publishEvent(event: any) {
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
  
  async getEventById(id: string) {
    return this.service.getEventById(id);
  }
  
  async getEvents(ids: string[]) {
    return this.service.getEvents(ids);
  }
  
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }
  
  // Bookmark methods
  async isBookmarked(eventId: string) {
    return this.service.isBookmarked(eventId);
  }
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string) {
    return this.service.addBookmark(eventId, collectionId, tags, note);
  }
  
  async removeBookmark(eventId: string) {
    return this.service.removeBookmark(eventId);
  }
  
  async getBookmarks() {
    return this.service.getBookmarks();
  }
  
  async getBookmarkCollections() {
    return this.service.getBookmarkCollections();
  }
  
  async getBookmarkMetadata() {
    return this.service.getBookmarkMetadata();
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string) {
    return this.service.createBookmarkCollection(name, color, description);
  }
  
  async processPendingOperations() {
    return this.service.processPendingOperations();
  }
  
  /**
   * Fetch user's oldest metadata event to determine account creation date (NIP-01)
   * @param pubkey User's public key
   * @returns Timestamp of the oldest metadata event or null
   */
  async getAccountCreationDate(pubkey: string): Promise<number | null> {
    // Delegate to the underlying service implementation
    if (this.service.getAccountCreationDate) {
      return this.service.getAccountCreationDate(pubkey);
    }
    
    // Fallback implementation if the service doesn't have this method
    console.warn('getAccountCreationDate not implemented in underlying service');
    return null;
  }
}

// Create an adapted instance and export it to replace the original
export const adaptedNostrService = new NostrAdapter(originalNostrService);
