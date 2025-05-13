
import { NostrEvent } from "../types";

/**
 * NIP-01: Utility functions for handling basic Nostr protocol features
 */

/**
 * Gets the creation date of an account based on the earliest metadata event
 * @param pubkey The public key to query
 * @param events Array of events to search through (optional)
 * @returns Date object representing the account creation time
 */
export function getAccountCreationDate(events: NostrEvent[]): Date | null {
  if (!events || events.length === 0) return null;
  
  // Find the oldest metadata event (kind 0)
  const metadataEvents = events.filter(event => event.kind === 0);
  
  if (metadataEvents.length === 0) return null;
  
  // Sort by creation date (ascending)
  const sortedEvents = [...metadataEvents].sort((a, b) => a.created_at - b.created_at);
  
  // Return the earliest timestamp
  return sortedEvents[0] ? new Date(sortedEvents[0].created_at * 1000) : null;
}

/**
 * NIP-10: Thread handling utility functions
 */

/**
 * Parse event tags to properly handle thread markers according to NIP-10
 * @param tags The tags array from a Nostr event
 * @returns Object containing root event ID, reply event ID, and mentions
 */
export function parseThreadTags(tags: string[][]): {
  rootId: string | null;
  replyId: string | null;
  mentions: string[];
} {
  const result = {
    rootId: null as string | null,
    replyId: null as string | null,
    mentions: [] as string[]
  };
  
  if (!tags || !Array.isArray(tags)) {
    return result;
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  // NIP-10 thread logic
  eTags.forEach((tag) => {
    // Tag format: ["e", <event-id>, <relay-url>?, <marker>?]
    if (tag.length < 2) return;
    
    const [_, eventId, , marker] = tag;
    
    // Handle special markers
    if (marker === "root") {
      result.rootId = eventId;
    } else if (marker === "reply") {
      result.replyId = eventId;
    } else if (!marker) {
      // No marker means it's either a root, reply, or mention
      if (!result.replyId) {
        result.replyId = eventId;
      } else {
        result.mentions.push(eventId);
      }
    } else {
      // Any other marker is considered a mention
      result.mentions.push(eventId);
    }
  });
  
  // If we have no explicit root but have a reply, the reply becomes our thread context
  if (!result.rootId && result.replyId) {
    result.rootId = result.replyId;
  }
  
  return result;
}

/**
 * NIP-05: DNS Identifier verification utilities
 */

/**
 * Verify a NIP-05 identifier and check if it resolves to the expected pubkey
 * Enhanced to validate JSON structure and names field
 * @param identifier - NIP-05 identifier in the format username@domain.com
 * @param expectedPubkey - The pubkey that should match the NIP-05 identifier
 * @returns True if the NIP-05 identifier resolves to the expected pubkey
 */
export async function verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
  if (!identifier || !identifier.includes('@') || !expectedPubkey) {
    console.log("Invalid NIP-05 identifier or missing pubkey");
    return false;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`NIP-05 verification failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    // Validate structure: must have names field that is an object
    if (!data || !data.names || typeof data.names !== 'object') {
      console.error("NIP-05 verification failed: Invalid response structure (missing names field)");
      return false;
    }
    
    // Check if the name exists in the names object
    if (!Object.prototype.hasOwnProperty.call(data.names, name)) {
      console.error(`NIP-05 verification failed: Username '${name}' not found in names object`);
      return false;
    }
    
    // Get the pubkey and verify it matches
    const resolvedPubkey = data.names[name];
    
    if (resolvedPubkey === expectedPubkey) {
      return true;
    } else {
      console.error(`NIP-05 verification failed: Pubkey mismatch`);
      return false;
    }
  } catch (error) {
    console.error("NIP-05 verification error:", error);
    return false;
  }
}

/**
 * NIP-39: External identity verification utility
 */

/**
 * Check for X/Twitter verification in profile data using NIP-39 standard
 * @param profileData The profile data object
 * @returns Object with verification status and info
 */
export function checkXVerification(profileData: any): {
  xVerified: boolean;
  xVerifiedInfo: { username: string; tweetId: string } | null;
} {
  if (!profileData) {
    return { xVerified: false, xVerifiedInfo: null };
  }
  
  // First, check for NIP-39 "i" tags in the event
  if (profileData.tags && Array.isArray(profileData.tags)) {
    const twitterTag = profileData.tags.find((tag: any[]) => 
      Array.isArray(tag) && tag.length >= 3 && tag[0] === 'i' && tag[1]?.startsWith('twitter:')
    );
    
    if (twitterTag) {
      const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
      const tweetId = twitterTag[2]; // Tweet ID is in position 2
      
      return {
        xVerified: true,
        xVerifiedInfo: { username, tweetId }
      };
    }
  }
  
  // Fall back to legacy verification if no NIP-39 tag found
  if (profileData.twitter_verified) {
    return {
      xVerified: true,
      xVerifiedInfo: { 
        username: profileData.twitter || '', 
        tweetId: profileData.twitter_proof || '' 
      }
    };
  }
  
  return { xVerified: false, xVerifiedInfo: null };
}

/**
 * NIP-65: Relay list metadata utilities
 */

/**
 * Parse relay list metadata from event according to NIP-65
 * @param event The kind 10002 event containing relay preferences
 * @returns Map of relay URLs to read/write permissions
 */
export function parseRelayList(event: NostrEvent): Map<string, { read: boolean, write: boolean }> {
  const relayMap = new Map<string, { read: boolean, write: boolean }>();
  
  if (!event || !event.tags || !Array.isArray(event.tags)) {
    return relayMap;
  }
  
  // Extract relay information from 'r' tags
  event.tags.forEach(tag => {
    if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
      const url = tag[1];
      let read = true;
      let write = true;
      
      // Check for read/write markers in positions 2 and later
      if (tag.length >= 3) {
        read = tag.includes('read');
        write = tag.includes('write');
      }
      
      relayMap.set(url, { read, write });
    }
  });
  
  return relayMap;
}
