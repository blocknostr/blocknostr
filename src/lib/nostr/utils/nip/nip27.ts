
/**
 * NIP-27: Mentions - Implementation of the Nostr protocol for formatting mentions
 * https://github.com/nostr-protocol/nips/blob/master/27.md
 */

import { nostrService } from '@/lib/nostr';
import { simpleProfileService } from '@/lib/services/profile/simpleProfileService';

// Regex to match nostr: URLs as defined in NIP-21
const NOSTR_URI_REGEX = /nostr:(npub1[a-z0-9]{6,}|nprofile1[a-z0-9]{6,}|nevent1[a-z0-9]{6,}|note1[a-z0-9]{6,})/gi;

// Regex to match @ mentions that could be converted to nostr: URLs
const AT_MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

/**
 * Extract all mentions (both nostr: URLs and @ mentions) from content
 */
export function extractMentions(content: string): string[] {
  if (!content) return [];
  
  const mentions: string[] = [];
  
  // Find all nostr: URLs
  const nostrMatches = content.match(NOSTR_URI_REGEX);
  if (nostrMatches) {
    mentions.push(...nostrMatches);
  }
  
  // Find all @ mentions
  const atMatches = content.match(AT_MENTION_REGEX);
  if (atMatches) {
    mentions.push(...atMatches);
  }
  
  return mentions;
}

/**
 * Convert a npub to a readable display name (if profile data is available)
 */
export async function getDisplayNameFromNpub(npub: string): Promise<string> {
  try {
    // Try to get profile data for this npub
    const profile = await simpleProfileService.getProfileMetadata(npub);
    
    if (profile && (profile.name || profile.display_name)) {
      return profile.display_name || profile.name;
    }
    
    // Fallback to shortened npub if no name available
    return shortenIdentifier(npub);
  } catch (error) {
    return shortenIdentifier(npub);
  }
}

/**
 * Shorten an identifier (npub, note, etc.) for display
 */
export function shortenIdentifier(identifier: string): string {
  if (!identifier) return '';
  
  // Format: prefix1...suffix
  const prefix = identifier.substring(0, 6);
  const suffix = identifier.substring(identifier.length - 4);
  
  return `${prefix}...${suffix}`;
}

/**
 * Convert a nostr URL to its corresponding hex value
 */
export function getHexFromNostrUrl(url: string): string | null {
  if (!url.startsWith('nostr:')) return null;
  
  const parts = url.split(':');
  if (parts.length < 2) return null;
  
  const identifier = parts[1];
  
  if (identifier.startsWith('npub1')) {
    return nostrService.getHexFromNpub(identifier);
  } else if (identifier.startsWith('note1') || identifier.startsWith('nevent1')) {
    return nostrService.getHexFromNote(identifier);
  }
  
  return null;
}

/**
 * Get the profile URL for a given npub or hex pubkey
 */
export function getProfileUrl(pubkeyOrNpub: string): string {
  try {
    // Ensure we have an npub format
    const npub = pubkeyOrNpub.startsWith('npub1') 
      ? pubkeyOrNpub 
      : nostrService.getNpubFromHex(pubkeyOrNpub);
      
    return `/profile/${npub}`;
  } catch (error) {
    console.error("Error generating profile URL:", error);
    return `/profile/${pubkeyOrNpub}`;
  }
}

/**
 * Get the event URL for a given note/event ID
 */
export function getEventUrl(noteId: string): string {
  return `/post/${noteId}`;
}

/**
 * Determines if a string is a valid nostr: URL
 */
export function isNostrUrl(text: string): boolean {
  return NOSTR_URI_REGEX.test(text);
}
