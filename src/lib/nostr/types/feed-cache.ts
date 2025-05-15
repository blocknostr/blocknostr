
import { NostrEvent } from '../types';

export interface FeedCacheOptions {
  authorPubkeys?: string[];
  hashtag?: string;
  since?: number;
  until?: number;
  mediaOnly?: boolean;
}

export interface FeedCacheEntry {
  events: NostrEvent[];
  timestamp: number;
  options: FeedCacheOptions;
}

export interface FeedCache {
  saveFeed: (feedType: string, events: NostrEvent[], options: FeedCacheOptions) => void;
  getFeed: (feedType: string, options: FeedCacheOptions) => NostrEvent[] | null;
  clearFeed: (feedType: string, options: FeedCacheOptions) => void;
  generateCacheKey: (feedType: string, options: FeedCacheOptions) => string;
  getRawEntry: (key: string) => FeedCacheEntry | null;
}
