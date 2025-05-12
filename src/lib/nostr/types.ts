
import type { Event } from 'nostr-tools';
import type { CircuitState } from './relay/circuit/circuit-breaker';

export interface NostrEvent extends Event {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface Relay {
  url: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'failed' | 'unknown';
  read?: boolean;
  write?: boolean;
  score?: number;
  avgResponse?: number;
  circuitStatus?: CircuitState;
  isRequired?: boolean;
}

export interface Filter {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  "#e"?: string[];
  "#p"?: string[];
  since?: number;
  until?: number;
  limit?: number;
  [key: `#${string}`]: string[] | undefined;
}

export type NostrFilter = Filter;

export interface NostrProfileMetadata {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  [key: string]: any;
}

export type EventDeDuplication = {
  eventId: string;
  createdAt: number;
};

export type ProposalCategory =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "link"
  | "file";

export interface BookmarkCollection {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkMetadata {
  eventId: string;
  collectionId?: string;
  tags?: string[];
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkWithMetadata extends NostrEvent {
  metadata: BookmarkMetadata;
}

export interface CacheOptions {
  authorPubkeys?: string[];
  hashtag?: string;
  since?: number;
  until?: number;
  mediaOnly?: boolean;
}

export interface ContentCache {
  cacheEvent: (event: NostrEvent, important?: boolean) => void;
  getEvent: (eventId: string) => NostrEvent | null;
  cacheEvents: (events: NostrEvent[], important?: boolean) => void;
  getEventsByAuthors: (authorPubkeys: string[]) => NostrEvent[];
  
  cacheProfile: (pubkey: string, profileData: any, important?: boolean) => void;
  getProfile: (pubkey: string) => any | null;
  
  cacheThread: (rootId: string, events: NostrEvent[], important?: boolean) => void;
  getThread: (rootId: string) => NostrEvent[] | null;
  
  cacheFeed: (feedType: string, events: NostrEvent[], options: CacheOptions, important?: boolean) => void;
  getFeed: (feedType: string, options: CacheOptions) => NostrEvent[] | null;
  
  feedCache: {
    getFeed: (feedType: string, options: CacheOptions) => NostrEvent[] | null;
    cacheFeed: (feedType: string, options: CacheOptions, events: NostrEvent[], expiryMs?: number) => void;
    clearFeed: (feedType: string, options: CacheOptions) => void;
    generateCacheKey: (feedType: string, options: CacheOptions) => string;
    getRawEntry: (key: string) => any;
  };
  
  cleanupExpiredEntries: () => void;
  clearAll: () => void;
  isOffline: () => boolean;
}

// Fix: Use export type for re-exporting CircuitState
export type { CircuitState };
