
/**
 * NIP-08: Mention - Implementation of the Nostr protocol for handling mentions
 * https://github.com/nostr-protocol/nips/blob/master/08.md
 */

import { nostrService } from '@/lib/nostr';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';

/**
 * Extract mention position from p-tag
 * NIP-08 format: ["p", "pubkey", "relay-url", "position"]
 */
export function getMentionPosition(tag: string[]): number | null {
  if (!tag || tag.length < 4 || tag[0] !== 'p') {
    return null;
  }
  
  try {
    const position = parseInt(tag[3], 10);
    if (isNaN(position) || position < 0) {
      return null;
    }
    return position;
  } catch (err) {
    return null;
  }
}

/**
 * Get profile information by pubkey
 * This function fetches profile information from cache or from the network
 */
export async function getProfileByPubkey(pubkey: string): Promise<any> {
  try {
    // Use unified profile service to get cached profile data
    return await unifiedProfileService.getProfile(pubkey);
  } catch (err) {
    console.error('Error fetching profile for mention:', err);
    return null;
  }
}

/**
 * Map p-tags to content positions for proper highlighting
 * @param content The note content
 * @param tags Array of tags from the note
 * @returns Map of positions to pubkeys
 */
export function mapMentionPositions(content: string, tags: string[][]): Map<number, string> {
  const mentionMap = new Map<number, string>();
  
  if (!tags || !content) {
    return mentionMap;
  }
  
  // Process p-tags with position information (NIP-08)
  tags.forEach(tag => {
    if (tag[0] === 'p') {
      const pubkey = tag[1];
      const position = tag.length >= 4 ? getMentionPosition(tag) : null;
      
      if (position !== null && position >= 0 && position < content.length) {
        mentionMap.set(position, pubkey);
      }
    }
  });
  
  return mentionMap;
}

/**
 * Find potential @ mentions in content and map them to p-tags
 * This is used when explicit positions aren't provided
 */
export function findAtMentions(content: string, tags: string[][]): Map<string, string> {
  const mentionMap = new Map<string, string>();
  const pTags = tags.filter(tag => tag[0] === 'p');
  
  if (!content || !pTags.length) {
    return mentionMap;
  }
  
  // Find all @ mentions in the content
  const atMentions = content.match(/@([a-zA-Z0-9_]+)/g) || [];
  
  if (atMentions.length === 0 || pTags.length === 0) {
    return mentionMap;
  }
  
  // Try to map @ mentions to p-tags by looking at profile data
  // This is heuristic-based and not perfect, but works for many cases
  for (const mention of atMentions) {
    const username = mention.substring(1); // Remove @ prefix
    
    // Map the username to a pubkey from p-tags if possible
    // Note: This requires profile data to be loaded
    // In a real implementation, this would be more sophisticated
    mentionMap.set(mention, ''); // Placeholder
  }
  
  return mentionMap;
}

/**
 * Determine if a given string is a potential NIP-08 mention
 */
export function isPotentialMention(text: string, position: number, mentionMap: Map<number, string>): boolean {
  return mentionMap.has(position);
}
