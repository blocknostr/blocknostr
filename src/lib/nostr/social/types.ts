
import { NostrEvent } from "../types";

/**
 * Types for the social manager
 */

export interface ContactList {
  pubkeys: string[];
  tags: string[][];
  content: string;
  contacts?: ContactListItem[];
}

export interface ContactListItem {
  pubkey: string;
  relay?: string;
  petname?: string;
}

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  events?: Record<string, NostrEvent[]>;
  // Additional properties for user interactions
  userHasLiked?: boolean;
  userHasReposted?: boolean;
  userHasZapped?: boolean;
  likers?: string[];
  reposters?: string[];
  zappers?: string[];
}

export interface ZapInfo {
  amount: number;
  sender: string;
  receiver: string;
  timestamp: number;
  eventId?: string;
}

export interface QuickReply {
  id: string;
  text: string;  // Changed from content to text
  category: string;
  usageCount: number;
  userCreated?: boolean;
}
