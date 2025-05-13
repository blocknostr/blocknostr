
import { NostrEvent } from "../types";

/**
 * Types for the social manager
 */

export interface ContactList {
  pubkeys: string[];
  tags: string[][];
  content: string;
}

export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  events: Record<string, NostrEvent[]>;
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
  content: string;
  category: string;
  userCreated: boolean;
}
