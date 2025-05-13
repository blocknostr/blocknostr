
import { NostrEvent } from '../types';

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  userHasLiked?: boolean; // Added to fix error in reactions.ts
}

export interface ContactList {
  following: string[];
  followers: string[];
  muted: string[];
  blocked: string[];
  // Adding these properties to fix errors in contacts.ts
  pubkeys?: string[];
  tags?: any[][];
  content?: string;
}

// Adding ZapInfo interface to fix error in zap.ts
export interface ZapInfo {
  amount: number;
  lnurl: string;
  recipient: string;
  relayUrl?: string;
}

export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
}
