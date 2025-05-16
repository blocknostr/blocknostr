
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
