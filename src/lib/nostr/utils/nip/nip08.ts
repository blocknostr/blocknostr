
/**
 * NIP-08: Mention - Implementation of the Nostr protocol for handling mentions
 * https://github.com/nostr-protocol/nips/blob/master/08.md
 */

import { nostrService } from '@/lib/nostr';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';
import { resolvePubkeyFromUsername, normalizeToHexPubkey } from './nip27';
import { isValidHexPubkey } from '@/lib/nostr/utils/keys';

/**
 * Extract mention position from p-tag
 * NIP-08 format: ["p", "pubkey", "relay-url", "position"]
 */
export function getMentionPosition(tag: string[]): number | null {
  if (!tag || tag.length < 4 || tag[0] !== 'p') {
    return null;
  }
  
  try {
    // The position can be a number or a string like "#[0]"
    let positionStr = tag[3];
    
    // Handle "#[index]" format
    if (positionStr.startsWith('#[') && positionStr.endsWith(']')) {
      positionStr = positionStr.substring(2, positionStr.length - 1);
    }
    
    const position = parseInt(positionStr, 10);
    if (isNaN(position) || position < 0) {
      return null;
    }
    return position;
  } catch (err) {
    console.error('Error parsing mention position:', err, 'Tag:', tag);
    return null;
  }
}

/**
 * Get profile information by pubkey
 * This function fetches profile information from cache or from the network
 */
export async function getProfileByPubkey(pubkey: string): Promise<any> {
  try {
    // Validate the pubkey
    if (!pubkey || !isValidHexPubkey(pubkey)) {
      console.warn('Invalid pubkey format for profile fetch:', pubkey);
      return null;
    }
    
    // Use unified profile service to get cached profile data
    return await unifiedProfileService.getProfile(pubkey);
  } catch (err) {
    console.error('Error fetching profile for mention:', err);
    return null;
  }
}

/**
 * Map p-tags to content positions for proper highlighting
 * Enhanced to handle NIP-08 mention positions
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
  for (const tag of tags) {
    if (Array.isArray(tag) && tag[0] === 'p' && tag.length >= 2) {
      const pubkey = tag[1];
      
      // Skip invalid pubkeys
      if (!isValidHexPubkey(pubkey)) {
        continue;
      }
      
      // Check if we have an explicit position in the tag (NIP-08)
      if (tag.length >= 4) {
        const position = getMentionPosition(tag);
        
        if (position !== null && position >= 0 && position < content.length) {
          mentionMap.set(position, pubkey);
        }
      }
    }
  }
  
  return mentionMap;
}

/**
 * Find potential @ mentions in content and map them to p-tags
 * Improved to use more sophisticated mapping between usernames and pubkeys
 */
export async function findAtMentions(content: string, tags: string[][]): Promise<Map<string, string>> {
  const mentionMap = new Map<string, string>();
  const pTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'p' && tag.length >= 2);
  
  if (!content || !pTags.length) {
    return mentionMap;
  }
  
  // Find all @ mentions in the content
  const atMentions = content.match(/@([a-zA-Z0-9_]+)/g) || [];
  
  if (atMentions.length === 0) {
    return mentionMap;
  }
  
  // Create a map of potential NIP-05 identifiers from p-tags
  const potentialNip05Map = new Map<string, string>();
  for (const tag of pTags) {
    const pubkey = tag[1];
    // Check if there's a suggested NIP-05 identifier
    if (tag.length >= 3 && tag[2] && tag[2].includes('@')) {
      const parts = tag[2].split('@');
      potentialNip05Map.set(parts[0], pubkey);
    }
  }
  
  // Try to map @ mentions to p-tags using various heuristics
  for (const mention of atMentions) {
    const username = mention.substring(1); // Remove @ prefix
    
    // 1. Check if we have a direct match in p-tags with NIP-05 identifiers
    if (potentialNip05Map.has(username)) {
      mentionMap.set(mention, potentialNip05Map.get(username) || '');
      continue;
    }
    
    // 2. Try to resolve username to pubkey using profile service
    const pubkey = await resolvePubkeyFromUsername(username, pTags);
    if (pubkey) {
      mentionMap.set(mention, pubkey);
      continue;
    }
    
    // 3. As a fallback, check if username might be a partial hex pubkey or npub
    // This is not recommended but included for backward compatibility
    for (const tag of pTags) {
      const tagPubkey = tag[1];
      if (tagPubkey.startsWith(username) || tagPubkey.endsWith(username)) {
        mentionMap.set(mention, tagPubkey);
        break;
      }
    }
  }
  
  return mentionMap;
}

/**
 * Determine if a given string is a potential NIP-08 mention
 */
export function isPotentialMention(text: string, position: number, mentionMap: Map<number, string>): boolean {
  return mentionMap.has(position);
}

/**
 * Parse out mentions from content according to NIP-08 and NIP-10 standards
 * @param content The content to parse
 * @param tags The tags array from the note
 * @returns An array of {position, pubkey} objects
 */
export function parseMentions(content: string, tags: string[][]): Array<{position: number, pubkey: string}> {
  const mentions: Array<{position: number, pubkey: string}> = [];
  
  if (!content || !tags) {
    return mentions;
  }
  
  // Get position-based mentions (NIP-08)
  const mentionMap = mapMentionPositions(content, tags);
  
  // Convert the map to an array of position/pubkey pairs
  for (const [position, pubkey] of mentionMap.entries()) {
    mentions.push({ position, pubkey });
  }
  
  // Sort by position to process them in order
  mentions.sort((a, b) => a.position - b.position);
  
  return mentions;
}

/**
 * Get all pubkeys mentioned in p-tags
 * @param tags Array of tags from the note
 * @returns Array of pubkeys
 */
export function getTaggedPubkeys(tags: string[][]): string[] {
  if (!tags) return [];
  
  const pubkeys: string[] = [];
  
  for (const tag of tags) {
    if (Array.isArray(tag) && tag[0] === 'p' && tag.length >= 2) {
      const pubkey = normalizeToHexPubkey(tag[1]);
      if (pubkey && !pubkeys.includes(pubkey)) {
        pubkeys.push(pubkey);
      }
    }
  }
  
  return pubkeys;
}
