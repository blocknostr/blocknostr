
import { EventManager } from '../event';
import { UserManager } from '../user';

export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
  eventManager?: EventManager;
  userManager?: UserManager;
  [key: string]: any;
}

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  userHasLiked?: boolean;
  userHasReposted?: boolean;
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
  pubkeys: string[];
  // Add missing properties used in contacts.ts
  tags?: any[][];
  content?: string;
}

// Add QuickReply interface for quick-replies components
export interface QuickReply {
  id: string;
  text: string;
  category: 'greeting' | 'thanks' | 'discussion' | 'custom';
  usageCount: number;
}

// Add ZapInfo interface needed for zap.ts
export interface ZapInfo {
  amount: number;
  lnurl: string;
  recipient: string;
  relayUrl?: string;
}

