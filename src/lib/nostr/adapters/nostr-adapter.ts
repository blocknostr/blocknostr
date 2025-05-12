
import { nostrService } from '../service';
import { BaseAdapter } from './base-adapter';
import { SocialAdapter } from './social-adapter';
import { RelayAdapter } from './relay-adapter';
import { DataAdapter } from './data-adapter';
import { CommunityAdapter } from './community-adapter';
import { BookmarkAdapter } from './bookmark-adapter';

/**
 * Main NostrAdapter that implements all functionality through composition
 * This ensures all components continue to work without changing their implementation
 */
export class NostrAdapter extends BaseAdapter {
  private socialAdapter: SocialAdapter;
  private relayAdapter: RelayAdapter;
  private dataAdapter: DataAdapter;
  private communityAdapter: CommunityAdapter;
  private bookmarkAdapter: BookmarkAdapter;
  
  constructor(service: typeof nostrService) {
    super(service);
    
    // Initialize all the adapters
    this.socialAdapter = new SocialAdapter(service);
    this.relayAdapter = new RelayAdapter(service);
    this.dataAdapter = new DataAdapter(service);
    this.communityAdapter = new CommunityAdapter(service);
    this.bookmarkAdapter = new BookmarkAdapter(service);
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
  
  // Relay methods
  async addRelay(relayUrl: string, readWrite: boolean = true) {
    return this.relayAdapter.addRelay(relayUrl, readWrite);
  }
  
  removeRelay(relayUrl: string) {
    return this.relayAdapter.removeRelay(relayUrl);
  }
  
  getRelayStatus() {
    return this.relayAdapter.getRelayStatus();
  }

  getRelayUrls() {
    return this.relayAdapter.getRelayUrls();
  }
  
  async getRelaysForUser(pubkey: string) {
    return this.relayAdapter.getRelaysForUser(pubkey);
  }
  
  async connectToDefaultRelays() {
    return this.relayAdapter.connectToDefaultRelays();
  }
  
  async connectToUserRelays() {
    return this.relayAdapter.connectToUserRelays();
  }
  
  async addMultipleRelays(relayUrls: string[]) {
    return this.relayAdapter.addMultipleRelays(relayUrls);
  }
  
  // Data retrieval methods
  async getEventById(id: string) {
    return this.dataAdapter.getEventById(id);
  }
  
  async getEvents(ids: string[]) {
    return this.dataAdapter.getEvents(ids);
  }
  
  async getProfilesByPubkeys(pubkeys: string[]) {
    return this.dataAdapter.getProfilesByPubkeys(pubkeys);
  }
  
  async getUserProfile(pubkey: string) {
    return this.dataAdapter.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, pubkey: string) {
    return this.dataAdapter.verifyNip05(identifier, pubkey);
  }
  
  // Community methods
  async createCommunity(name: string, description: string) {
    return this.communityAdapter.createCommunity(name, description);
  }
  
  async createProposal(communityId: string, title: string, description: string, options: string[], category: string) {
    return this.communityAdapter.createProposal(communityId, title, description, options, category);
  }

  async voteOnProposal(proposalId: string, optionIndex: number) {
    return this.communityAdapter.voteOnProposal(proposalId, optionIndex);
  }
  
  // Bookmark methods
  async isBookmarked(eventId: string) {
    return this.bookmarkAdapter.isBookmarked(eventId);
  }
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string) {
    return this.bookmarkAdapter.addBookmark(eventId, collectionId, tags, note);
  }
  
  async removeBookmark(eventId: string) {
    return this.bookmarkAdapter.removeBookmark(eventId);
  }
  
  async getBookmarks() {
    return this.bookmarkAdapter.getBookmarks();
  }
  
  async getBookmarkCollections() {
    return this.bookmarkAdapter.getBookmarkCollections();
  }
  
  async getBookmarkMetadata() {
    return this.bookmarkAdapter.getBookmarkMetadata();
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string) {
    return this.bookmarkAdapter.createBookmarkCollection(name, color, description);
  }
  
  async processPendingOperations() {
    return this.bookmarkAdapter.processPendingOperations();
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
  
  get bookmarkManager() {
    return this.bookmarkAdapter.bookmarkManager;
  }
}
