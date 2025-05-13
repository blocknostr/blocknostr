
import { NostrEvent } from '../types';

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
}

export interface ContactList {
  following: string[];
  followers: string[];
  muted: string[];
  blocked: string[];
}

export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
}
