
export interface SocialManagerOptions {
  cacheExpiration?: number;
  maxCacheSize?: number;
  enableMetrics?: boolean;
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
  tags: string[][];
  content: string;
}

export interface QuickReply {
  id: string;
  text: string;
  category: 'greeting' | 'thanks' | 'discussion' | 'custom';
  usageCount: number;
}

export interface ZapInfo {
  amount: number;
  recipient: string;
  content?: string;
  zapper?: string;
  bolt11?: string;
}
