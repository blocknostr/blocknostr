
import { NostrEvent } from "../types";

/**
 * Shortens a pubkey for display purposes
 */
export const shortenPubkey = (pubkey: string, length = 8): string => {
  if (!pubkey) return '';
  if (pubkey.length <= length * 2) return pubkey;
  
  return `${pubkey.slice(0, length)}...${pubkey.slice(-length)}`;
};

/**
 * Sorts events by timestamp (newest first)
 */
export const sortEventsByDate = (events: NostrEvent[]): NostrEvent[] => {
  return [...events].sort((a, b) => b.created_at - a.created_at);
};

/**
 * Extracts hashtags from event content and tags
 */
export const extractHashtags = (event: NostrEvent): string[] => {
  const tags = new Set<string>();
  
  // Extract hashtags from t tags
  if (Array.isArray(event.tags)) {
    event.tags
      .filter(tag => Array.isArray(tag) && tag[0] === 't' && tag[1])
      .forEach(tag => tags.add(tag[1].toLowerCase()));
  }
  
  // Extract hashtags from content
  if (event.content) {
    const hashtagRegex = /#(\w+)/g;
    let match;
    
    while ((match = hashtagRegex.exec(event.content)) !== null) {
      if (match[1]) {
        tags.add(match[1].toLowerCase());
      }
    }
  }
  
  return Array.from(tags);
};

/**
 * Creates a human-readable timestamp from an event
 */
export const formatEventTimestamp = (event: NostrEvent): string => {
  if (!event.created_at) return '';
  
  const date = new Date(event.created_at * 1000);
  return date.toLocaleString();
};

/**
 * Checks if an event is a reply to another event
 */
export const isReplyEvent = (event: NostrEvent): boolean => {
  if (!Array.isArray(event.tags)) return false;
  
  return event.tags.some(tag => 
    Array.isArray(tag) && 
    tag[0] === 'e' && 
    tag.length >= 2
  );
};

/**
 * Gets the target event ID that this event is replying to
 */
export const getReplyTargetId = (event: NostrEvent): string | null => {
  if (!Array.isArray(event.tags)) return null;
  
  // Look for an 'e' tag with reply marker
  const replyTag = event.tags.find(tag => 
    Array.isArray(tag) && 
    tag[0] === 'e' && 
    tag.length >= 3 && 
    tag[3] === 'reply'
  );
  
  if (replyTag && replyTag[1]) return replyTag[1];
  
  // Fall back to the first 'e' tag
  const firstETag = event.tags.find(tag => 
    Array.isArray(tag) && 
    tag[0] === 'e' && 
    tag.length >= 2
  );
  
  return firstETag ? firstETag[1] : null;
};
