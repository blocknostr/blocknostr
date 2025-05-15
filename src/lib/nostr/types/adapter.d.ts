
/**
 * Type definitions for the NostrAdapter interfaces
 */

import { NostrEvent, Relay } from './index';

export interface BaseAdapterInterface {
  publicKey: string | null;
  login(): Promise<string | null>;
  signOut(): void;
  formatPubkey(pubkey: string): string;
  getNpubFromHex(hexPubkey: string): string;
  getHexFromNpub(npub: string): string;
  
  // Authentication methods
  isLoggedIn(): boolean;
  hasConnectedRelays(): boolean;
  
  // Account info methods
  getAccountCreationDate(pubkey: string): Promise<number | null>;
}

export interface EventAdapterInterface extends BaseAdapterInterface {
  // Event methods
  subscribe(filters: any[], onEvent: (event: any) => void, relays?: string[]): string;
  unsubscribe(subId: string): void;
  publishEvent(event: any): Promise<string | null>;
}

export interface SocialAdapterInterface extends BaseAdapterInterface {
  isFollowing(pubkey: string): boolean;
  followUser(pubkey: string): Promise<boolean>;
  unfollowUser(pubkey: string): Promise<boolean>;
  sendDirectMessage(recipientPubkey: string, content: string): Promise<string | null>;
  
  // Add following property to match what components expect
  following: string[];
  
  // Moderation
  muteUser(pubkey: string): Promise<boolean>;
  unmuteUser(pubkey: string): Promise<boolean>;
  isUserMuted(pubkey: string): Promise<boolean>;
  blockUser(pubkey: string): Promise<boolean>;
  unblockUser(pubkey: string): Promise<boolean>;
  isUserBlocked(pubkey: string): Promise<boolean>;
  
  // Social manager
  socialManager: {
    likeEvent(event: any): Promise<string | null>;
    repostEvent(event: any): Promise<string | null>;
    getReactionCounts(eventId: string): Promise<{ likes: number, reposts: number }>;
    reactToEvent(eventId: string, emoji?: string): Promise<string | null>;
  };
}

export interface RelayAdapterInterface extends BaseAdapterInterface {
  addRelay(relayUrl: string, readWrite?: boolean): Promise<boolean>;
  removeRelay(relayUrl: string): boolean;
  getRelayStatus(): Relay[];
  getRelayUrls(): string[];
  getRelaysForUser(pubkey: string): Promise<{ [url: string]: { read: boolean, write: boolean } } | null>;
  connectToDefaultRelays(): Promise<string[]>;
  connectToUserRelays(): Promise<void>;
  addMultipleRelays(relayUrls: string[]): Promise<void>;
  publishRelayList(relays: { url: string, read: boolean, write: boolean }[]): Promise<boolean>;
  
  relayManager: any; // Define specific relay manager interface if needed
}

export interface DataAdapterInterface extends BaseAdapterInterface {
  getEventById(id: string): Promise<NostrEvent | null>;
  getEvents(ids: string[]): Promise<NostrEvent[]>;
  getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>>;
  getUserProfile(pubkey: string): Promise<Record<string, any> | null>;
  verifyNip05(identifier: string, pubkey: string): Promise<boolean>;
}

export interface CommunityAdapterInterface extends BaseAdapterInterface, EventAdapterInterface {
  createCommunity(name: string, description: string): Promise<string | null>;
  createProposal(communityId: string, title: string, description: string, options: string[], category: string): Promise<string | null>;
  voteOnProposal(proposalId: string, optionIndex: number): Promise<boolean>;
  
  communityManager: any; // Define specific community manager interface if needed
}

export interface NostrAdapterInterface extends BaseAdapterInterface,
  SocialAdapterInterface,
  RelayAdapterInterface,
  DataAdapterInterface,
  CommunityAdapterInterface,
  EventAdapterInterface {
  
  // Domain-specific property accessors
  readonly social: SocialAdapterInterface;
  readonly relay: RelayAdapterInterface;
  readonly data: DataAdapterInterface;
  readonly community: CommunityAdapterInterface;
  readonly event: EventAdapterInterface;
}
