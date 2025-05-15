
/**
 * NIP-27: Mentions - Implementation of the Nostr protocol for formatting mentions
 * https://github.com/nostr-protocol/nips/blob/master/27.md
 */

import { nip19 } from 'nostr-tools';
import { nostrService } from '@/lib/nostr';
import { simpleProfileService } from '@/lib/services/profile/simpleProfileService';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';
import { isValidHexPubkey } from '@/lib/nostr/utils/keys';

// Regex to match nostr: URLs as defined in NIP-21 and NIP-27
// This matches npub1, note1, nevent1, nprofile1, and also direct pubkey hex format
const NOSTR_URI_REGEX = /nostr:(npub1[a-z0-9]{6,}|nprofile1[a-z0-9]{6,}|nevent1[a-z0-9]{6,}|note1[a-z0-9]{6,}|[0-9a-f]{64})/gi;

// Regex to match @ mentions that could be converted to nostr: URLs
const AT_MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

// Cache for username to pubkey resolution
const usernameCache = new Map<string, string>();

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
    // Validate input
    if (!npub || typeof npub !== 'string') {
      return shortenIdentifier(npub || '');
    }
    
    // Try to get profile data for this npub
    const hexPubkey = getHexFromNostrUrl(`nostr:${npub}`);
    if (!hexPubkey) {
      return shortenIdentifier(npub);
    }
    
    // Validate the hex pubkey
    if (!isValidHexPubkey(hexPubkey)) {
      console.warn('Invalid hex pubkey format:', hexPubkey);
      return shortenIdentifier(npub);
    }
    
    // Use unified profile service for more reliable profile data
    const profile = await unifiedProfileService.getProfile(hexPubkey);
    
    if (profile && (profile.name || profile.display_name)) {
      return profile.display_name || profile.name;
    }
    
    // Fallback to shortened npub if no name available
    return shortenIdentifier(npub);
  } catch (error) {
    console.error('Error getting display name from npub:', error);
    return shortenIdentifier(npub);
  }
}

/**
 * Get display name for a pubkey using UnifiedProfileService
 */
export async function getDisplayNameFromPubkey(pubkey: string): Promise<string> {
  try {
    // Validate input
    if (!pubkey || typeof pubkey !== 'string') {
      return 'unknown';
    }
    
    // Validate the pubkey format
    if (!isValidHexPubkey(pubkey)) {
      return shortenIdentifier(pubkey);
    }
    
    const profile = await unifiedProfileService.getProfile(pubkey);
    
    if (profile && (profile.name || profile.display_name)) {
      return profile.display_name || profile.name;
    }
    
    // If no profile data, use shortened pubkey
    return shortenIdentifier(pubkey);
  } catch (error) {
    console.error('Error getting display name from pubkey:', error);
    return shortenIdentifier(pubkey);
  }
}

/**
 * Try to resolve a username (@username) to a pubkey
 * This uses a cache and the profile service
 */
export async function resolvePubkeyFromUsername(username: string, pTags?: string[][]): Promise<string | null> {
  try {
    if (!username || typeof username !== 'string') {
      return null;
    }
    
    // Remove @ if present
    const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
    
    // Check cache first
    if (usernameCache.has(cleanUsername)) {
      return usernameCache.get(cleanUsername) || null;
    }
    
    // If pTags are provided, try to match username with any NIP-05 identifiers
    if (pTags && Array.isArray(pTags)) {
      for (const tag of pTags) {
        if (Array.isArray(tag) && tag[0] === 'p' && tag.length >= 3) {
          const pubkey = tag[1];
          // If a suggested NIP-05 identifier is provided in position 3
          if (tag[2] && tag[2].includes('@')) {
            const parts = tag[2].split('@');
            if (parts[0] === cleanUsername) {
              usernameCache.set(cleanUsername, pubkey);
              return pubkey;
            }
          }
        }
      }
    }
    
    // If no match in pTags, try to find profiles with this username
    // This is more expensive, so we try pTags first
    try {
      // We could implement a more robust search here
      // For now, this is a simple placeholder
      
      // Cache the result (even if null) to avoid repeated lookups
      usernameCache.set(cleanUsername, null);
      return null;
    } catch (error) {
      console.error('Error searching for profile by username:', error);
      return null;
    }
  } catch (error) {
    console.error('Error resolving pubkey from username:', error);
    return null;
  }
}

/**
 * Shorten an identifier (npub, note, etc.) for display
 */
export function shortenIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') return '';
  
  // Format: prefix1...suffix
  const prefix = identifier.substring(0, 6);
  const suffix = identifier.substring(identifier.length - 4);
  
  return `${prefix}...${suffix}`;
}

/**
 * Convert a nostr URL to its corresponding hex value
 * Enhanced to handle all NIP-27 formats
 */
export function getHexFromNostrUrl(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  
  if (!url.startsWith('nostr:')) return null;
  
  const parts = url.split(':');
  if (parts.length < 2) return null;
  
  const identifier = parts[1];
  
  try {
    // Direct hex pubkey format (nostr:32bytehex)
    if (isValidHexPubkey(identifier)) {
      return identifier;
    }
    
    // Handle different bech32 identifiers properly
    if (identifier.startsWith('npub1')) {
      // Decode npub to get hex pubkey
      const { type, data } = nip19.decode(identifier);
      if (type !== 'npub') return null;
      return data as string;
    } 
    else if (identifier.startsWith('note1')) {
      // Decode note to get hex note id
      const { type, data } = nip19.decode(identifier);
      if (type !== 'note') return null;
      return data as string;
    }
    else if (identifier.startsWith('nevent1')) {
      // Decode nevent to get event data
      const { type, data } = nip19.decode(identifier);
      if (type !== 'nevent') return null;
      return data.id as string; // nevent contains id, relays, etc.
    }
    else if (identifier.startsWith('nprofile1')) {
      // Decode nprofile to get profile data
      const { type, data } = nip19.decode(identifier);
      if (type !== 'nprofile') return null;
      return data.pubkey as string; // nprofile contains pubkey, relays, etc.
    }
    // Add more formats as needed
  } catch (error) {
    console.error("Error converting nostr URL to hex:", error, "URL:", url);
    return null;
  }
  
  return null;
}

/**
 * Get the profile URL for a given npub or hex pubkey
 */
export function getProfileUrl(pubkeyOrNpub: string): string {
  try {
    if (!pubkeyOrNpub || typeof pubkeyOrNpub !== 'string') {
      return '/profile/unknown';
    }
    
    // Ensure we have an npub format
    const npub = pubkeyOrNpub.startsWith('npub1') 
      ? pubkeyOrNpub 
      : pubkeyOrNpub.length === 64 && /^[0-9a-f]{64}$/i.test(pubkeyOrNpub)
        ? nostrService.getNpubFromHex(pubkeyOrNpub)
        : pubkeyOrNpub; // Keep as is if it's neither npub nor valid hex
      
    return `/profile/${npub}`;
  } catch (error) {
    console.error("Error generating profile URL:", error, "Input:", pubkeyOrNpub);
    return `/profile/${pubkeyOrNpub}`;
  }
}

/**
 * Get the event URL for a given note/event ID
 */
export function getEventUrl(noteId: string): string {
  try {
    if (!noteId || typeof noteId !== 'string') {
      return '/post/unknown';
    }
    
    // Convert to note1 format if it's a hex ID
    const noteIdToUse = noteId.startsWith('note1') 
      ? noteId 
      : noteId.length === 64 && /^[0-9a-f]{64}$/i.test(noteId)
        ? nip19.noteEncode(noteId)
        : noteId; // Keep as is if it's neither note1 nor valid hex
      
    return `/post/${noteIdToUse}`;
  } catch (error) {
    console.error("Error generating event URL:", error, "Input:", noteId);
    return `/post/${noteId}`;
  }
}

/**
 * Determines if a string is a valid nostr: URL
 */
export function isNostrUrl(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  return NOSTR_URI_REGEX.test(text);
}

/**
 * Get profile picture URL for a pubkey
 */
export async function getProfilePictureFromPubkey(pubkey: string): Promise<string | null> {
  try {
    if (!pubkey || typeof pubkey !== 'string' || !isValidHexPubkey(pubkey)) {
      return null;
    }
    
    const profile = await unifiedProfileService.getProfile(pubkey);
    return profile?.picture || null;
  } catch (error) {
    console.error("Error getting profile picture:", error);
    return null;
  }
}

/**
 * Clear the username cache (useful for testing or forced refresh)
 */
export function clearUsernameCache(): void {
  usernameCache.clear();
}

/**
 * Get the hex pubkey from various formats (npub, nprofile, direct hex)
 */
export function normalizeToHexPubkey(pubkeyOrNpub: string): string | null {
  try {
    if (!pubkeyOrNpub || typeof pubkeyOrNpub !== 'string') {
      return null;
    }
    
    // If it's a hex pubkey, validate and return it
    if (isValidHexPubkey(pubkeyOrNpub)) {
      return pubkeyOrNpub;
    }
    
    // If it's an npub, decode it
    if (pubkeyOrNpub.startsWith('npub1')) {
      try {
        const { type, data } = nip19.decode(pubkeyOrNpub);
        if (type !== 'npub') return null;
        return data as string;
      } catch (e) {
        return null;
      }
    }
    
    // If it's an nprofile, decode it
    if (pubkeyOrNpub.startsWith('nprofile1')) {
      try {
        const { type, data } = nip19.decode(pubkeyOrNpub);
        if (type !== 'nprofile') return null;
        return data.pubkey as string;
      } catch (e) {
        return null;
      }
    }
    
    // If it starts with nostr:, extract the identifier
    if (pubkeyOrNpub.startsWith('nostr:')) {
      return getHexFromNostrUrl(pubkeyOrNpub);
    }
    
    return null;
  } catch (error) {
    console.error('Error normalizing to hex pubkey:', error);
    return null;
  }
}
