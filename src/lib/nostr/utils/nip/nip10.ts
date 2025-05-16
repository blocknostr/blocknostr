/**
 * NIP-10: Thread Replies
 * https://github.com/nostr-protocol/nips/blob/master/10.md
 */

import { NostrEvent } from "@/lib/nostr/types";

/**
 * Get the value of a specific tag from event.tags
 */
export const getTagValue = (event: NostrEvent, tagName: string): string | undefined => {
  if (!event.tags || !Array.isArray(event.tags)) return undefined;
  
  const tag = event.tags.find(tag => 
    Array.isArray(tag) && tag.length >= 2 && tag[0] === tagName
  );
  
  return tag ? tag[1] : undefined;
};

/**
 * Get all values of specific tags from event.tags
 */
export const getTagValues = (event: NostrEvent, tagName: string): string[] => {
  if (!event.tags || !Array.isArray(event.tags)) return [];
  
  return event.tags
    .filter(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === tagName)
    .map(tag => tag[1]);
};

/**
 * Get a tagged event reference with specific marker
 */
export const getTaggedEventWithMarker = (event: NostrEvent, marker: string): string | undefined => {
  if (!event.tags || !Array.isArray(event.tags)) return undefined;
  
  const tag = event.tags.find(tag => 
    Array.isArray(tag) && tag.length >= 4 && tag[0] === 'e' && tag[3] === marker
  );
  
  return tag ? tag[1] : undefined;
};

/**
 * Get the root event ID from a thread (if available)
 */
export const getRootEventId = (event: NostrEvent): string | undefined => {
  return getTaggedEventWithMarker(event, 'root');
};

/**
 * Get the direct reply event ID (if available)
 */
export const getReplyEventId = (event: NostrEvent): string | undefined => {
  return getTaggedEventWithMarker(event, 'reply');
};

/**
 * Get all mentioned public keys from p tags
 */
export const getMentionedPubkeys = (event: NostrEvent): string[] => {
  return getTagValues(event, 'p');
};

/**
 * Check if an event is a reply to another event
 */
export const isReplyToEvent = (event: NostrEvent, eventId: string): boolean => {
  if (!event.tags || !Array.isArray(event.tags)) return false;
  
  return event.tags.some(tag => 
    Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e' && tag[1] === eventId
  );
};

/**
 * Check if an event mentions a user
 */
export const mentionsUser = (event: NostrEvent, pubkey: string): boolean => {
  if (!event.tags || !Array.isArray(event.tags)) return false;
  
  return event.tags.some(tag => 
    Array.isArray(tag) && tag.length >= 2 && tag[0] === 'p' && tag[1] === pubkey
  );
};

/**
 * Create threading tags for a new post
 * Handles both top-level posts and replies according to NIP-10
 */
export const createThreadingTags = (options: {
  replyingTo?: string,  // ID of the direct event we're replying to
  rootEvent?: string    // ID of the root event of the thread
}): string[][] => {
  const { replyingTo, rootEvent } = options;
  const tags: string[][] = [];
  
  if (replyingTo) {
    // If we have both a root and a reply target, and they're different
    if (rootEvent && rootEvent !== replyingTo) {
      // Include the root with marker
      tags.push(['e', rootEvent, '', 'root']);
      // Include the reply with marker
      tags.push(['e', replyingTo, '', 'reply']);
    } else {
      // If replying directly to the root or rootEvent not provided
      tags.push(['e', replyingTo, '', 'root']);
    }
  }
  
  return tags;
};

/**
 * Parse thread tags from an event's tags array
 * This is useful for understanding the thread structure
 */
export const parseThreadTags = (tags: string[][]): { rootId: string | null, replyId: string | null, mentions: string[] } => {
  let rootId: string | null = null;
  let replyId: string | null = null;
  const mentions: string[] = [];
  
  // Process e-tags
  const eTags = tags.filter(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e');
  
  for (const tag of eTags) {
    if (tag.length >= 4) {
      // Check for marked tags
      if (tag[3] === 'root') {
        rootId = tag[1];
      } else if (tag[3] === 'reply') {
        replyId = tag[1];
      } else {
        // Other marked tags are considered mentions
        mentions.push(tag[1]);
      }
    } else {
      // Unmarked e-tags
      if (!rootId && !replyId) {
        // First unmarked e-tag is considered both root and reply
        rootId = tag[1];
        replyId = tag[1];
      } else {
        // Subsequent unmarked e-tags are mentions
        mentions.push(tag[1]);
      }
    }
  }
  
  return { rootId, replyId, mentions };
};

/**
 * Validate NIP-10 tags for proper formatting
 */
export const validateNip10Tags = (tags: string[][]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check e-tags for proper format
  const eTags = tags.filter(tag => Array.isArray(tag) && tag.length >= 2 && tag[0] === 'e');
  
  eTags.forEach((tag, index) => {
    // Check event ID format (should be a 64-character hex string)
    if (!/^[0-9a-f]{64}$/.test(tag[1])) {
      errors.push(`E-tag at index ${index} has an invalid event ID: ${tag[1]}`);
    }
    
    // Check for proper marker if present
    if (tag.length >= 4 && tag[3] && !['root', 'reply', 'mention'].includes(tag[3])) {
      errors.push(`E-tag at index ${index} has an invalid marker: ${tag[3]}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
};
