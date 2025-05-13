
// Define essential types for social interactions

export interface ZapInfo {
  amount: number;
  sender?: string;
  recipient: string;
  comment?: string;
  eventId?: string;
}

export interface QuickReply {
  id: string;
  text: string;  // Changed from content to text
  category: string;
  createdAt?: number;
  usageCount: number; // Added usageCount
}

// Add missing types needed by imports
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
  tags: string[][];
  content: string;
}

export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
  [key: string]: any;
}
