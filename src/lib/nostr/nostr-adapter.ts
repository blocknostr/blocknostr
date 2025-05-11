
import { AuthAdapter } from './adapters/auth-adapter';
import { SocialAdapter } from './adapters/social-adapter';
import { ModerationAdapter } from './adapters/moderation-adapter';
import { RelayAdapter } from './adapters/relay-adapter';
import { CommunityAdapter } from './adapters/community-adapter';
import { UtilitiesAdapter } from './adapters/utilities-adapter';
import { BookmarkAdapter } from './adapters/bookmark-adapter';
import { EventAdapter } from './adapters/event-adapter';
import { ProfileAdapter } from './adapters/profile-adapter';
import { nostrService as originalNostrService } from './service';

/**
 * NostrAdapter combines all adapter modules to provide a complete interface
 * This ensures all components continue to work without changing their implementation
 */
class NostrAdapter {
  private service: typeof originalNostrService;
  
  // Adapter modules
  private authAdapter: AuthAdapter;
  private socialAdapter: SocialAdapter;
  private moderationAdapter: ModerationAdapter;
  private relayAdapter: RelayAdapter;
  private communityAdapter: CommunityAdapter;
  private utilitiesAdapter: UtilitiesAdapter;
  private bookmarkAdapter: BookmarkAdapter;
  private eventAdapter: EventAdapter;
  private profileAdapter: ProfileAdapter;
  
  constructor(service: typeof originalNostrService) {
    this.service = service;
    
    // Initialize all adapter modules
    this.authAdapter = new AuthAdapter(service);
    this.socialAdapter = new SocialAdapter(service);
    this.moderationAdapter = new ModerationAdapter(service);
    this.relayAdapter = new RelayAdapter(service);
    this.communityAdapter = new CommunityAdapter(service);
    this.utilitiesAdapter = new UtilitiesAdapter(service);
    this.bookmarkAdapter = new BookmarkAdapter(service);
    this.eventAdapter = new EventAdapter(service);
    this.profileAdapter = new ProfileAdapter(service);
  }

  // Auth methods from AuthAdapter
  get publicKey() { return this.authAdapter.publicKey; }
  get following() { return this.authAdapter.following; }
  login() { return this.authAdapter.login(); }
  signOut() { return this.authAdapter.signOut(); }
  
  // Social methods from SocialAdapter
  isFollowing(pubkey: string) { return this.socialAdapter.isFollowing(pubkey); }
  followUser(pubkey: string) { return this.socialAdapter.followUser(pubkey); }
  unfollowUser(pubkey: string) { return this.socialAdapter.unfollowUser(pubkey); }
  sendDirectMessage(recipientPubkey: string, content: string) { return this.socialAdapter.sendDirectMessage(recipientPubkey, content); }
  get socialManager() { return this.socialAdapter.socialManager; }
  
  // Moderation methods from ModerationAdapter
  muteUser(pubkey: string) { return this.moderationAdapter.muteUser(pubkey); }
  unmuteUser(pubkey: string) { return this.moderationAdapter.unmuteUser(pubkey); }
  isUserMuted(pubkey: string) { return this.moderationAdapter.isUserMuted(pubkey); }
  blockUser(pubkey: string) { return this.moderationAdapter.blockUser(pubkey); }
  unblockUser(pubkey: string) { return this.moderationAdapter.unblockUser(pubkey); }
  isUserBlocked(pubkey: string) { return this.moderationAdapter.isUserBlocked(pubkey); }
  
  // Relay methods from RelayAdapter
  addRelay(relayUrl: string, readWrite: boolean = true) { return this.relayAdapter.addRelay(relayUrl, readWrite); }
  removeRelay(relayUrl: string) { return this.relayAdapter.removeRelay(relayUrl); }
  getRelayStatus() { return this.relayAdapter.getRelayStatus(); }
  getRelayUrls() { return this.relayAdapter.getRelayUrls(); }
  getRelaysForUser(pubkey: string) { return this.relayAdapter.getRelaysForUser(pubkey); }
  connectToDefaultRelays() { return this.relayAdapter.connectToDefaultRelays(); }
  connectToUserRelays() { return this.relayAdapter.connectToUserRelays(); }
  addMultipleRelays(relayUrls: string[]) { return this.relayAdapter.addMultipleRelays(relayUrls); }
  get relayManager() { return this.relayAdapter.relayManager; }
  
  // Community methods from CommunityAdapter
  createCommunity(name: string, description: string) { return this.communityAdapter.createCommunity(name, description); }
  createProposal(communityId: string, title: string, description: string, options: string[], category: string) { 
    return this.communityAdapter.createProposal(communityId, title, description, options, category); 
  }
  voteOnProposal(proposalId: string, optionIndex: number) { return this.communityAdapter.voteOnProposal(proposalId, optionIndex); }
  get communityManager() { return this.communityAdapter.communityManager; }
  
  // Utility methods from UtilitiesAdapter
  formatPubkey(pubkey: string) { return this.utilitiesAdapter.formatPubkey(pubkey); }
  getNpubFromHex(hexPubkey: string) { return this.utilitiesAdapter.getNpubFromHex(hexPubkey); }
  getHexFromNpub(npub: string) { return this.utilitiesAdapter.getHexFromNpub(npub); }
  
  // Bookmark methods from BookmarkAdapter
  isBookmarked(eventId: string) { return this.bookmarkAdapter.isBookmarked(eventId); }
  addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string) { 
    return this.bookmarkAdapter.addBookmark(eventId, collectionId, tags, note); 
  }
  removeBookmark(eventId: string) { return this.bookmarkAdapter.removeBookmark(eventId); }
  getBookmarks() { return this.bookmarkAdapter.getBookmarks(); }
  getBookmarkCollections() { return this.bookmarkAdapter.getBookmarkCollections(); }
  getBookmarkMetadata() { return this.bookmarkAdapter.getBookmarkMetadata(); }
  createBookmarkCollection(name: string, color?: string, description?: string) { 
    return this.bookmarkAdapter.createBookmarkCollection(name, color, description); 
  }
  processPendingOperations() { return this.bookmarkAdapter.processPendingOperations(); }
  get bookmarkManager() { return this.bookmarkAdapter.bookmarkManager; }
  
  // Event methods from EventAdapter
  publishEvent(event: any) { return this.eventAdapter.publishEvent(event); }
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]) { 
    return this.eventAdapter.subscribe(filters, onEvent, relays); 
  }
  unsubscribe(subId: string) { return this.eventAdapter.unsubscribe(subId); }
  getEventById(id: string) { return this.eventAdapter.getEventById(id); }
  getEvents(ids: string[]) { return this.eventAdapter.getEvents(ids); }
  
  // Profile methods from ProfileAdapter
  getProfilesByPubkeys(pubkeys: string[]) { return this.profileAdapter.getProfilesByPubkeys(pubkeys); }
  getUserProfile(pubkey: string) { return this.profileAdapter.getUserProfile(pubkey); }
  verifyNip05(identifier: string, pubkey: string) { return this.profileAdapter.verifyNip05(identifier, pubkey); }
}

// Create an adapted instance and export it to replace the original
export const adaptedNostrService = new NostrAdapter(originalNostrService);
