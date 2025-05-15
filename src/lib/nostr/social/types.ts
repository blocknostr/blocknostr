
/**
 * Reaction counts for a post/note
 */
export interface ReactionCounts {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
}

/**
 * Represents a user's contact list
 */
export interface ContactList {
  pubkeys: string[];
  follows: string[];
  metadata: Record<string, any>;
}
