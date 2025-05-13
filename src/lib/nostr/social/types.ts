
import { NostrEvent } from '../types';

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  userHasLiked?: boolean;
  userHasReposted?: boolean; // Added this property for reactions.ts
  userHasZapped?: boolean;
  likers?: string[];
  reposters?: string[];
  zappers?: string[];
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

// Adding QuickReply interface for quick-replies components
export interface QuickReply {
  id: string;
  text: string;
  category: 'greeting' | 'thanks' | 'discussion' | 'custom';
  usageCount: number;
}
