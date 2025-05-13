
export interface ReactionCounts {
  likes: number;
  reposts: number;
  zaps: number;
  zapAmount: number;
  replies: number;
  userHasLiked: boolean;
  userHasReposted: boolean;
  userHasZapped: boolean;
  likers: string[];
  reposters: string[];
  zappers: string[];
}

export interface ContactList {
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
  pubkey: string;
  amount: number;
  content?: string;
  timestamp: number;
}
