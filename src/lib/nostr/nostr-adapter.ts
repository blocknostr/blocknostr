
import { nostrService } from './service';
import { NostrEvent, Relay } from './types';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

/**
 * This is a comprehensive implementation of the Nostr service adapter
 * that provides all the methods needed throughout the application.
 */
class AdaptedNostrService {
  private service: typeof nostrService;
  private _publicKey: string | null = null;
  
  constructor(service: typeof nostrService) {
    this.service = service;
    this._publicKey = service.publicKey; // Cache the initial value
  }

  /**
   * Get relay connection status
   * @returns Array of relay connection statuses
   */
  getRelayStatus() {
    // Return the relay status information 
    return this.service.getRelayStatus();
  }

  /**
   * Get relay URLs
   * @returns Array of relay URLs
   */
  getRelayUrls() {
    return this.service.getRelayUrls();
  }

  /**
   * Create batched fetchers for parallel data loading
   * @param hexPubkey Hex-encoded public key
   * @param options Filter options
   * @returns Array of fetcher functions
   */
  createBatchedFetchers(hexPubkey: string, options: any) {
    return this.service.createBatchedFetchers(hexPubkey, options);
  }

  // Access to socialManager instance
  get socialManager() {
    return this.service.socialManager;
  }

  // Communities functionality
  async createCommunity(name: string, description: string) {
    return this.service.createCommunity(name, description);
  }

  async createProposal(
    communityId: string, 
    title: string, 
    description: string, 
    options: string[], 
    category: string
  ) {
    return this.service.createProposal(communityId, title, description, options, category);
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.service.voteOnProposal(proposalId, optionIndex);
  }

  // Account creation date
  async getAccountCreationDate(pubkey: string) {
    return this.service.getAccountCreationDate(pubkey);
  }

  // Access to following list - FIXED: Return directly instead of using a getter
  get following() {
    return this.service.following;
  }

  // Profile caching
  async getCachedProfile(pubkey: string) {
    if (this.service.getUserProfile) {
      return this.service.getUserProfile(pubkey);
    }
    return null;
  }

  // User Properties - FIXED: Use cached value to avoid recursion
  get publicKey() {
    return this._publicKey;
  }

  // Auth methods
  async login() {
    const success = await this.service.login();
    if (success) {
      this._publicKey = this.service.publicKey; // Update the cached value
    }
    return success;
  }

  signOut() {
    const result = this.service.signOut();
    this._publicKey = null; // Clear the cached value
    return result;
  }

  // Connection methods
  async connectToUserRelays() {
    return this.service.connectToUserRelays();
  }

  async connectToDefaultRelays() {
    return this.service.connectToDefaultRelays();
  }

  // Subscription methods
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }

  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }

  // Event publishing
  async publishEvent(event: Partial<NostrEvent>) {
    return this.service.publishEvent(event);
  }

  // Profile methods
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile(pubkey);
  }

  // Following methods
  isFollowing(pubkey: string) {
    return this.service.isFollowing(pubkey);
  }

  async followUser(pubkey: string) {
    return this.service.followUser(pubkey);
  }

  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser(pubkey);
  }

  // Direct messaging
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }

  // Utility methods
  formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub') {
    return formatPubkey(pubkey, format);
  }

  getNpubFromHex(hex: string) {
    return getNpubFromHex(hex);
  }

  getHexFromNpub(npub: string) {
    return getHexFromNpub(npub);
  }

  // Add more methods as needed from the NostrService interface
  async getRelaysForUser(pubkey: string) {
    return this.service.getRelaysForUser(pubkey);
  }

  async addMultipleRelays(relayUrls: string[]) {
    return this.service.addMultipleRelays(relayUrls);
  }

  async addRelay(relayUrl: string, readWrite: boolean = true) {
    return this.service.addRelay(relayUrl, readWrite);
  }

  removeRelay(relayUrl: string) {
    return this.service.removeRelay(relayUrl);
  }

  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]) {
    // Make sure we have the method before calling it
    if ('publishRelayList' in this.service && typeof this.service.publishRelayList === 'function') {
      return this.service.publishRelayList(relays);
    }
    return false;
  }

  async getEventById(id: string) {
    return this.service.getEventById(id);
  }

  async getEvents(filters: any) {
    return this.service.getEvents(filters);
  }

  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys(pubkeys);
  }

  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05(identifier, pubkey);
  }

  // User moderation
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

  // Reactions
  async reactToPost(eventId: string, reaction: string = "+") {
    return this.service.reactToPost(eventId, reaction);
  }

  // Reposts
  async repostNote(eventId: string, authorPubkey: string) {
    return this.service.repostNote(eventId, authorPubkey);
  }

  // Profile updates
  async publishProfileMetadata(metadata: Record<string, any>) {
    return this.service.publishProfileMetadata(metadata);
  }
  
  // Bookmark methods
  async isBookmarked(eventId: string): Promise<boolean> {
    if ('isBookmarked' in this.service) {
      return this.service.isBookmarked(eventId);
    }
    return false;
  }
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    if ('addBookmark' in this.service) {
      return this.service.addBookmark(eventId, collectionId, tags, note);
    }
    return false;
  }
  
  async removeBookmark(eventId: string): Promise<boolean> {
    if ('removeBookmark' in this.service) {
      return this.service.removeBookmark(eventId);
    }
    return false;
  }
}

// Import the raw service instance
import { nostrService as rawNostrService } from './service';

// Create and export the adapted instance
export const adaptedNostrService = new AdaptedNostrService(rawNostrService);
