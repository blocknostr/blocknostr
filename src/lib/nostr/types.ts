export interface NostrEvent {
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
  status: "connected" | "connecting" | "disconnected" | "error" | "failed" | "unknown";
  read?: boolean;
  write?: boolean;
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

// Add proper CacheOptions interface
export interface CacheOptions {
  authorPubkeys?: string[];
  hashtag?: string;
  since?: number;
  until?: number;
  mediaOnly?: boolean;
}

// Update ContentCache interface to include all required methods
export interface ContentCache {
  // Event methods
  cacheEvent: (event: NostrEvent, important?: boolean) => void;
  getEvent: (eventId: string) => NostrEvent | null;
  cacheEvents: (events: NostrEvent[], important?: boolean) => void;
  getEventsByAuthors: (authorPubkeys: string[]) => NostrEvent[];
  
  // Profile methods
  cacheProfile: (pubkey: string, profileData: any, important?: boolean) => void;
  getProfile: (pubkey: string) => any | null;
  
  // Thread methods
  cacheThread: (rootId: string, events: NostrEvent[], important?: boolean) => void;
  getThread: (rootId: string) => NostrEvent[] | null;
  
  // Feed methods
  cacheFeed: (feedType: string, events: NostrEvent[], options: CacheOptions, important?: boolean) => void;
  getFeed: (feedType: string, options: CacheOptions) => NostrEvent[] | null;
  
  // Feed cache access
  feedCache: {
    getFeed: (feedType: string, options: CacheOptions) => NostrEvent[] | null;
    cacheFeed: (feedType: string, options: CacheOptions, events: NostrEvent[], expiryMs?: number) => void;
    clearFeed: (feedType: string, options: CacheOptions) => void;
    generateCacheKey: (feedType: string, options: CacheOptions) => string;
    getRawEntry: (key: string) => any;
  };
  
  // Utility methods
  cleanupExpiredEntries: () => void;
  clearAll: () => void;
  isOffline: () => boolean;
}
