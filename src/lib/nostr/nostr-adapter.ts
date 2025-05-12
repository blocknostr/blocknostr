
import { nostrService } from './service';
import { NostrEvent, Relay, ProposalCategory } from './types';
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
    // Cache the initial value - this prevents infinite recursion
    this._publicKey = service.publicKey; 
  }

  /**
   * Get relay connection status
   * @returns Array of relay connection statuses
   */
  getRelayStatus() {
    // Return the relay status information 
    return this.service.getRelayStatus?.() || [];
  }

  /**
   * Get relay URLs
   * @returns Array of relay URLs
   */
  getRelayUrls() {
    return this.service.getRelayUrls?.() || [];
  }

  /**
   * Create batched fetchers for parallel data loading
   * @param hexPubkey Hex-encoded public key
   * @param options Filter options
   * @returns Array of fetcher functions
   */
  createBatchedFetchers(hexPubkey: string, options: any) {
    return this.service.createBatchedFetchers?.(hexPubkey, options) || [];
  }

  // Access to socialManager instance
  get socialManager() {
    return this.service.socialManager;
  }

  // Communities functionality
  async createCommunity(name: string, description: string) {
    return this.service.createCommunity?.(name, description) || false;
  }

  async createProposal(
    communityId: string, 
    title: string, 
    description: string, 
    options: string[], 
    category: ProposalCategory
  ) {
    return this.service.createProposal?.(communityId, title, description, options, category) || false;
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.service.voteOnProposal?.(proposalId, optionIndex) || false;
  }

  // Account creation date
  async getAccountCreationDate(pubkey: string) {
    return this.service.getAccountCreationDate?.(pubkey) || null;
  }

  // Access to following list - Return directly instead of using a getter
  get following() {
    return this.service.following || [];
  }

  // Profile caching
  async getCachedProfile(pubkey: string) {
    if (this.service.getUserProfile) {
      return this.service.getUserProfile(pubkey);
    }
    return null;
  }

  // User Properties - Use cached value to avoid recursion
  get publicKey() {
    return this._publicKey;
  }

  // Auth methods
  async login() {
    const success = await (this.service.login?.() || false);
    if (success && this.service.publicKey !== undefined) {
      this._publicKey = this.service.publicKey; // Update the cached value
    }
    return success;
  }

  signOut() {
    const result = this.service.signOut?.() || false;
    this._publicKey = null; // Clear the cached value
    return result;
  }

  // Connection methods
  async connectToUserRelays() {
    return this.service.connectToUserRelays?.() || false;
  }

  async connectToDefaultRelays() {
    return this.service.connectToDefaultRelays?.() || false;
  }

  // Subscription methods
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe?.(filters, onEvent, relays) || "";
  }

  unsubscribe(subId: string) {
    return this.service.unsubscribe?.(subId) || false;
  }

  // Event publishing
  async publishEvent(event: Partial<NostrEvent>) {
    return this.service.publishEvent?.(event) || null;
  }

  // Profile methods
  async getUserProfile(pubkey: string) {
    return this.service.getUserProfile?.(pubkey) || null;
  }

  // Following methods
  isFollowing(pubkey: string) {
    return this.service.isFollowing?.(pubkey) || false;
  }

  async followUser(pubkey: string) {
    return this.service.followUser?.(pubkey) || false;
  }

  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser?.(pubkey) || false;
  }

  // Direct messaging
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage?.(recipientPubkey, content) || false;
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
    return this.service.getRelaysForUser?.(pubkey) || [];
  }

  async addMultipleRelays(relayUrls: string[]) {
    return this.service.addMultipleRelays?.(relayUrls) || false;
  }

  async addRelay(relayUrl: string, readWrite: boolean = true) {
    return this.service.addRelay?.(relayUrl, readWrite) || false;
  }

  removeRelay(relayUrl: string) {
    return this.service.removeRelay?.(relayUrl) || false;
  }

  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]) {
    if (this.service.publishRelayList) {
      return this.service.publishRelayList(relays);
    }
    return false;
  }

  async getEventById(id: string) {
    return this.service.getEventById?.(id) || null;
  }

  async getEvents(filters: any) {
    return this.service.getEvents?.(filters) || [];
  }

  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.service.getProfilesByPubkeys?.(pubkeys) || {};
  }

  async verifyNip05(identifier: string, pubkey: string) {
    return this.service.verifyNip05?.(identifier, pubkey) || false;
  }

  // User moderation
  async muteUser(pubkey: string) {
    return this.service.muteUser?.(pubkey) || false;
  }

  async unmuteUser(pubkey: string) {
    return this.service.unmuteUser?.(pubkey) || false;
  }

  async isUserMuted(pubkey: string) {
    return this.service.isUserMuted?.(pubkey) || false;
  }

  async blockUser(pubkey: string) {
    return this.service.blockUser?.(pubkey) || false;
  }

  async unblockUser(pubkey: string) {
    return this.service.unblockUser?.(pubkey) || false;
  }

  async isUserBlocked(pubkey: string) {
    return this.service.isUserBlocked?.(pubkey) || false;
  }

  // Reactions
  async reactToPost(eventId: string, reaction: string = "+") {
    return this.service.reactToPost?.(eventId, reaction) || false;
  }

  // Reposts
  async repostNote(eventId: string, authorPubkey: string) {
    return this.service.repostNote?.(eventId, authorPubkey) || false;
  }

  // Profile updates
  async publishProfileMetadata(metadata: Record<string, any>) {
    return this.service.publishProfileMetadata?.(metadata) || false;
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
