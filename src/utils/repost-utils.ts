
import { NostrEvent } from "@/lib/nostr";

/**
 * Parse a repost event and extract information about the original post
 * @param event The repost event to parse
 * @returns The original event ID and pubkey if found
 */
export const parseRepostEvent = (event: NostrEvent): { originalEventId?: string, originalEventPubkey?: string | null } => {
  try {
    // Some clients store the original event in content as JSON
    const content = JSON.parse(event.content);
    
    if (content.event && content.event.id) {
      return {
        originalEventId: content.event.id,
        originalEventPubkey: content.event.pubkey
      };
    }
  } catch (e) {
    // If parsing fails, try to get event reference from tags
    const eventReference = event.tags.find(tag => tag[0] === 'e');
    if (eventReference && eventReference[1]) {
      // Find pubkey reference
      const pubkeyReference = event.tags.find(tag => tag[0] === 'p');
      return {
        originalEventId: eventReference[1],
        originalEventPubkey: pubkeyReference ? pubkeyReference[1] : null
      };
    }
  }
  
  return { originalEventId: undefined, originalEventPubkey: undefined };
};

/**
 * Updates the repost data state with information about a repost
 */
export const trackRepostData = (
  event: NostrEvent, 
  originalEventId: string, 
  originalEventPubkey: string | null,
  setRepostData: React.Dispatch<React.SetStateAction<Record<string, { pubkey: string, original: NostrEvent }>>>
) => {
  setRepostData(prev => ({
    ...prev,
    [originalEventId]: { 
      pubkey: event.pubkey,  // The reposter
      original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
    }
  }));
};
