import { NostrService } from './service';

/**
 * Adapter class to maintain backward compatibility with existing components
 * This bridges old method names to new implementations
 */
export class NostrServiceAdapter {
  private service: NostrService;
  
  constructor(service: NostrService) {
    this.service = service;
  }
  
  // Add adapter methods for backward compatibility
  
  connectToDefaultRelays() {
    if (this.service.connectToUserRelays) {
      return this.service.connectToUserRelays();
    }
    return Promise.resolve(false);
  }
  
  getRelayUrls() {
    if (this.service.getRelayStatus) {
      const relays = this.service.getRelayStatus();
      return relays.map(r => r.url);
    }
    return [];
  }
  
  getRelayStatus() {
    return this.service.getRelayStatus ? this.service.getRelayStatus() : [];
  }
  
  async fetchUserProfile(pubkey: string) {
    if (this.service.getUserProfile) {
      return this.service.getUserProfile(pubkey);
    }
    return null;
  }
  
  async fetchUserProfiles(pubkeys: string[]) {
    if (this.service.getProfilesByPubkeys) {
      return this.service.getProfilesByPubkeys(pubkeys);
    }
    return [];
  }
  
  async fetchEvent(id: string) {
    if (this.service.getEventById) {
      return this.service.getEventById(id);
    }
    return null;
  }
  
  async fetchEvents(ids: string[]) {
    if (this.service.getEvents) {
      return this.service.getEvents(ids);
    }
    return [];
  }
  
  async publishNote(content: string, tags: string[][] = []) {
    return this.service.publishEvent({
      kind: 1,
      content,
      tags
    });
  }
  
  async likeEvent(eventId: string, authorPubkey: string) {
    return this.service.reactToPost ? this.service.reactToPost(eventId, '+') : false;
  }
  
  async repostEvent(eventId: string, authorPubkey: string) {
    return this.service.repostNote ? this.service.repostNote(eventId, authorPubkey) : false;
  }
  
  async followUser(pubkey: string) {
    return this.service.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string) {
    return this.service.unfollowUser(pubkey);
  }
  
  isFollowing(pubkey: string) {
    return this.service.isFollowing(pubkey);
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string) {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }
  
  async updateProfile(metadata: Record<string, any>) {
    return this.service.publishProfileMetadata(metadata);
  }
  
  async bookmarkEvent(eventId: string, collectionId?: string, tags?: string[], note?: string) {
    return this.service.addBookmark(eventId, collectionId, tags, note);
  }
  
  async unbookmarkEvent(eventId: string) {
    return this.service.removeBookmark(eventId);
  }
  
  async isEventBookmarked(eventId: string) {
    return this.service.isBookmarked(eventId);
  }
  
  async getBookmarkedEvents() {
    return this.service.getBookmarks();
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string) {
    return this.service.createBookmarkCollection(name, color, description);
  }
  
  async getBookmarkCollections() {
    return this.service.getBookmarkCollections();
  }
  
  async getBookmarkMetadata() {
    return this.service.getBookmarkMetadata();
  }
  
  async processPendingBookmarkOperations() {
    return this.service.processPendingOperations();
  }
  
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
  
  formatPubkey(pubkey: string) {
    return this.service.formatPubkey(pubkey);
  }
  
  getNpubFromHex(hexPubkey: string) {
    return this.service.getNpubFromHex(hexPubkey);
  }
  
  getHexFromNpub(npub: string) {
    return this.service.getHexFromNpub(npub);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) {
    return this.service.subscribe(filters, onEvent, relays);
  }
  
  unsubscribe(subId: string) {
    return this.service.unsubscribe(subId);
  }
}
