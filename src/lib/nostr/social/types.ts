
/**
 * Represents a Nostr social interaction
 */
export interface SocialInteraction {
  type: 'follow' | 'unfollow' | 'like' | 'repost' | 'reply' | 'message';
  targetPubkey?: string;
  targetEventId?: string;
  content?: string;
  timestamp: number;
}

/**
 * Status of a social action
 */
export interface SocialActionStatus {
  success: boolean;
  message?: string;
  eventId?: string;
}

/**
 * Social relationship types
 */
export type RelationshipType = 'following' | 'follower' | 'mutual' | 'none';
