
import { NostrService } from './service';

/**
 * This adapter extends the NostrService to provide compatibility with 
 * the methods expected by components throughout the application.
 */
export class NostrServiceAdapter {
  private service: NostrService;
  
  constructor(service: NostrService) {
    this.service = service;
  }
  
  // === User Management ===
  
  get publicKey(): string | null {
    return this.service.publicKey;
  }
  
  get following(): string[] {
    return this.service.following || [];
  }
  
  async login(): Promise<boolean> {
    return this.service.login();
  }
  
  signOut(): void {
    this.service.signOut();
  }
  
  isFollowing(pubkey: string): boolean {
    return this.service.isFollowing(pubkey);
  }
  
  async followUser(pubkey: string): Promise<boolean> {
    return this.service.followUser(pubkey);
  }
  
  async unfollowUser(pubkey: string): Promise<boolean> {
    return this.service.unfollowUser(pubkey);
  }
  
  // === Key Utilities ===
  
  formatPubkey(pubkey: string): string {
    return this.service.formatPubkey(pubkey);
  }
  
  getNpubFromHex(hexPubkey: string): string {
    return this.service.getNpubFromHex(hexPubkey);
  }
  
  getHexFromNpub(npub: string): string {
    return this.service.getHexFromNpub(npub);
  }
  
  // === Relay Management ===
  
  async connectToRelays(relays: string[]): Promise<void> {
    return this.service.connectToRelays(relays);
  }
  
  async connectToUserRelays(): Promise<void> {
    return this.service.connectToUserRelays();
  }
  
  async connectToDefaultRelays(): Promise<void> {
    // This is a compatibility method for components still expecting this method
    return this.service.connectToRelays([
      "wss://relay.damus.io", 
      "wss://relay.nostr.band", 
      "wss://nos.lol"
    ]);
  }
  
  getRelayStatus(): { url: string; status: string }[] {
    return this.service.getRelayStatus();
  }
  
  // === Social Interactions ===
  
  get socialManager() {
    return this.service.socialManager;
  }
  
  async sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null> {
    return this.service.sendDirectMessage(recipientPubkey, content);
  }
  
  async reactToPost(eventId: string, emoji: string = "+"): Promise<string | null> {
    return this.service.reactToPost(eventId, emoji);
  }
  
  async repostNote(eventId: string, authorPubkey: string): Promise<string | null> {
    return this.service.repostNote(eventId, authorPubkey);
  }
  
  // === User Profile ===
  
  async getUserProfile(pubkey: string): Promise<any> {
    return this.service.getUserProfile(pubkey);
  }
  
  async verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
    return this.service.verifyNip05(identifier, expectedPubkey);
  }
  
  // === Event Management ===
  
  async publishEvent(event: any): Promise<string | null> {
    return this.service.publishEvent(event);
  }
  
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string {
    return this.service.subscribe(filters, onEvent);
  }
  
  unsubscribe(subId: string): void {
    return this.service.unsubscribe(subId);
  }
  
  async getEventById(id: string): Promise<any | null> {
    return this.service.getEventById(id);
  }
  
  async getEvents(ids: string[]): Promise<any[]> {
    return this.service.getEvents(ids);
  }
  
  async getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>> {
    return this.service.getProfilesByPubkeys(pubkeys);
  }
  
  // === Bookmarks ===
  
  async addBookmark(eventId: string, collectionId?: string, tags?: string[], note?: string): Promise<boolean> {
    return this.service.addBookmark(eventId, collectionId, tags, note);
  }
  
  async removeBookmark(eventId: string): Promise<boolean> {
    return this.service.removeBookmark(eventId);
  }
  
  async getBookmarks(): Promise<string[]> {
    return this.service.getBookmarks();
  }
  
  async isBookmarked(eventId: string): Promise<boolean> {
    return this.service.isBookmarked(eventId);
  }
  
  async createBookmarkCollection(name: string, color?: string, description?: string): Promise<string | null> {
    return this.service.createBookmarkCollection(name, color, description);
  }
  
  async getBookmarkCollections(): Promise<any[]> {
    return this.service.getBookmarkCollections();
  }
  
  async getBookmarkMetadata(): Promise<any[]> {
    return this.service.getBookmarkMetadata();
  }
  
  async processPendingOperations(): Promise<void> {
    return this.service.processPendingOperations();
  }
  
  // === Community ===
  
  async createCommunity(name: string, description: string): Promise<string | null> {
    return this.service.createCommunity(name, description);
  }
  
  async createProposal(
    communityId: string,
    title: string,
    description: string,
    options: string[],
    category: string,
    minQuorum?: number,
    endsAt?: number
  ): Promise<string | null> {
    return this.service.createProposal(
      communityId, 
      title, 
      description, 
      options, 
      category,
      minQuorum,
      endsAt
    );
  }
  
  async voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null> {
    return this.service.voteOnProposal(proposalId, optionIndex);
  }
  
  // === User Moderation ===
  
  async muteUser(pubkey: string): Promise<boolean> {
    return this.service.muteUser(pubkey);
  }

  async unmuteUser(pubkey: string): Promise<boolean> {
    return this.service.unmuteUser(pubkey);
  }

  async isUserMuted(pubkey: string): Promise<boolean> {
    return this.service.isUserMuted(pubkey);
  }

  async blockUser(pubkey: string): Promise<boolean> {
    return this.service.blockUser(pubkey);
  }

  async unblockUser(pubkey: string): Promise<boolean> {
    return this.service.unblockUser(pubkey);
  }

  async isUserBlocked(pubkey: string): Promise<boolean> {
    return this.service.isUserBlocked(pubkey);
  }
}
