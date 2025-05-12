
/**
 * This is a comprehensive implementation of the Nostr service adapter
 * that provides all the methods needed throughout the application.
 */

import { nostrService } from '@/lib/nostr';
import { NostrEvent } from './types';
import { formatPubkey, getNpubFromHex, getHexFromNpub } from './utils/keys';

// Complete adapter that exposes all methods needed by our components
export const adaptedNostrService = {
  /**
   * Get relay connection status
   * @returns Array of relay connection statuses
   */
  getRelayStatus: () => {
    // Return the relay status information 
    return nostrService.getRelays().map(relay => ({
      url: relay.url, 
      status: relay.status || 'unknown',
      read: true,
      write: true
    }));
  },

  /**
   * Get relay URLs
   * @returns Array of relay URLs
   */
  getRelayUrls: () => {
    return nostrService.getRelays().map(relay => relay.url);
  },

  /**
   * Create batched fetchers for parallel data loading
   * @param hexPubkey Hex-encoded public key
   * @param options Filter options
   * @returns Array of fetcher functions
   */
  createBatchedFetchers: (hexPubkey: string, options: any) => {
    return [
      async () => {
        // Basic implementation that uses the existing nostrService
        return await nostrService.getEvents([{
          kinds: options.kinds || [1],
          authors: [hexPubkey],
          limit: options.limit || 50
        }]);
      }
    ];
  },

  // User Properties
  get publicKey(): string | null {
    return nostrService.publicKey;
  },

  // Auth methods
  async login(): Promise<boolean> {
    return nostrService.login();
  },

  signOut(): void {
    return nostrService.signOut();
  },

  // Connection methods
  async connectToUserRelays(): Promise<void> {
    return nostrService.connectToUserRelays();
  },

  async connectToDefaultRelays(): Promise<void> {
    return nostrService.connectToUserRelays(); // Alias for backward compatibility
  },

  // Subscription methods
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    return nostrService.subscribe(filters, onEvent, relays);
  },

  unsubscribe(subId: string): void {
    return nostrService.unsubscribe(subId);
  },

  // Event publishing
  async publishEvent(event: Partial<NostrEvent>): Promise<string | null> {
    return nostrService.publishEvent(event);
  },

  // Profile methods
  async getUserProfile(pubkey: string): Promise<any> {
    return nostrService.getUserProfile(pubkey);
  },

  // Following methods
  isFollowing(pubkey: string): boolean {
    return nostrService.isFollowing(pubkey);
  },

  async followUser(pubkey: string): Promise<boolean> {
    return nostrService.followUser(pubkey);
  },

  async unfollowUser(pubkey: string): Promise<boolean> {
    return nostrService.unfollowUser(pubkey);
  },

  // Direct messaging
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    return nostrService.sendDirectMessage(recipientPubkey, content);
  },

  // Utility methods
  formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub'): string {
    return formatPubkey(pubkey, format);
  },

  getNpubFromHex(hex: string): string {
    return getNpubFromHex(hex);
  },

  getHexFromNpub(npub: string): string {
    return getHexFromNpub(npub);
  },

  // Add more methods as needed from the NostrService interface
  async getRelaysForUser(pubkey: string): Promise<string[]> {
    return nostrService.getRelaysForUser(pubkey);
  },

  async addMultipleRelays(relayUrls: string[]): Promise<void> {
    return nostrService.addMultipleRelays(relayUrls);
  },

  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<void> {
    return nostrService.addRelay(relayUrl, readWrite);
  },

  removeRelay(relayUrl: string): void {
    return nostrService.removeRelay(relayUrl);
  },

  async publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean> {
    return nostrService.publishRelayList(relays);
  },

  async getEventById(id: string): Promise<NostrEvent | null> {
    return nostrService.getEventById(id);
  },

  async getEvents(ids: string[]): Promise<NostrEvent[]> {
    return nostrService.getEvents(ids);
  },

  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    return nostrService.getProfilesByPubkeys(pubkeys);
  },

  async verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
    return nostrService.verifyNip05(identifier, pubkey);
  },

  // User moderation
  async muteUser(pubkey: string): Promise<boolean> {
    return nostrService.muteUser(pubkey);
  },

  async unmuteUser(pubkey: string): Promise<boolean> {
    return nostrService.unmuteUser(pubkey);
  },

  async isUserMuted(pubkey: string): Promise<boolean> {
    return nostrService.isUserMuted(pubkey);
  },

  async blockUser(pubkey: string): Promise<boolean> {
    return nostrService.blockUser(pubkey);
  },

  async unblockUser(pubkey: string): Promise<boolean> {
    return nostrService.unblockUser(pubkey);
  },

  async isUserBlocked(pubkey: string): Promise<boolean> {
    return nostrService.isUserBlocked(pubkey);
  },

  // Reactions
  async reactToPost(eventId: string, reaction: string): Promise<string | null> {
    return nostrService.reactToPost(eventId, reaction);
  },

  // Reposts
  async repostNote(eventId: string, authorPubkey: string): Promise<string | null> {
    return nostrService.repostNote(eventId, authorPubkey);
  },

  // Bookmark methods
  async isBookmarked(eventId: string): Promise<boolean> {
    return nostrService.isBookmarked(eventId);
  },

  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return nostrService.addBookmark(eventId, collectionId, tags, note);
  },

  async removeBookmark(eventId: string): Promise<boolean> {
    return nostrService.removeBookmark(eventId);
  },

  async getBookmarks(): Promise<any[]> {
    return nostrService.getBookmarks();
  },

  async getBookmarkCollections(): Promise<any[]> {
    return nostrService.getBookmarkCollections();
  },

  async getBookmarkMetadata(): Promise<any> {
    return nostrService.getBookmarkMetadata();
  },

  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<any> {
    return nostrService.createBookmarkCollection(name, color, description);
  },

  async processPendingOperations(): Promise<void> {
    return nostrService.processPendingOperations();
  },

  // Profile updates
  async publishProfileMetadata(metadata: Record<string, any>): Promise<string | null> {
    return nostrService.publishProfileMetadata(metadata);
  }
};
