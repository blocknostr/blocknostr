
/**
 * Interface that defines the service methods required by the adapters
 * This helps keep the code type-safe and makes it clear what methods adapters can access
 */
export interface NostrServiceInterface {
  // Core properties
  publicKey: string | null;
  following: string[];
  communityManager: any;
  socialManager: any;
  relayManager: any;
  
  // Core methods
  getPublicKey(): string | null;
  setPublicKey(publicKey: string | null): void;
  setPrivateKey(privateKey: string | null): void;
  
  // Event methods
  publishEvent(event: any): Promise<string | null>;
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string;
  unsubscribe(subId: string): void;
  
  // Relay methods
  getConnectedRelayUrls(): string[];
  connectToUserRelays(): Promise<boolean>;
  getRelayStatus(): Array<{ url: string; status: string; }>;
  getRelayUrls(): string[];
  addRelay(relayUrl: string, readWrite?: boolean): Promise<boolean>;
  removeRelay(relayUrl: string): void;
  
  // Community methods
  createCommunity(name: string, description: string): Promise<string | null>;
  createProposal(communityId: string, title: string, description: string, options: string[], category: any): Promise<string | null>;
  voteOnProposal(proposalId: string, optionIndex: number): Promise<string | null>;
  
  // Social methods
  isFollowing(pubkey: string): boolean;
  followUser(pubkey: string): Promise<boolean>;
  unfollowUser(pubkey: string): Promise<boolean>;
  sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null>;
  reactToPost(id: string, emoji?: string): Promise<string | null>;
  repostNote(id: string, pubkey: string): Promise<string | null>;
  
  // Profile methods
  getUserProfile(pubkey: string): Promise<any>;
  getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>>;
  
  // Event data methods
  getEventById(id: string): Promise<any>;
  getEvents(ids: string[]): Promise<any[]>;
  
  // Authentication methods
  login(): Promise<boolean>;
  signOut(): void;
  
  // Verification methods
  verifyNip05(identifier: string, pubkey: string): Promise<boolean>;
  getAccountCreationDate(pubkey: string): Promise<number | null>;
  
  // User moderation methods
  muteUser(pubkey: string): Promise<boolean>;
  unmuteUser(pubkey: string): Promise<boolean>;
  isUserMuted(pubkey: string): Promise<boolean>;
  blockUser(pubkey: string): Promise<boolean>;
  unblockUser(pubkey: string): Promise<boolean>;
  isUserBlocked(pubkey: string): Promise<boolean>;
  
  // Cleanup
  cleanup(): void;
}
