
/**
 * NIP-27: Mentions - Implementation of the Nostr protocol for formatting mentions
 * https://github.com/nostr-protocol/nips/blob/master/27.md
 */

import { nip19 } from 'nostr-tools';
import { nostrService } from '@/lib/nostr';
import { simpleProfileService } from '@/lib/services/profile/simpleProfileService';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';

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
    const hexPubkey = getHexFromNostrUrl(`nostr:${npub}`);
    if (!hexPubkey) {
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
    return shortenIdentifier(npub);
  }
}

/**
 * Get display name for a pubkey using UnifiedProfileService
 */
export async function getDisplayNameFromPubkey(pubkey: string): Promise<string> {
  try {
    const profile = await unifiedProfileService.getProfile(pubkey);
    
    if (profile && (profile.name || profile.display_name)) {
      return profile.display_name || profile.name;
    }
    
    // If no profile data, use shortened pubkey
    return shortenIdentifier(pubkey);
  } catch (error) {
    return shortenIdentifier(pubkey);
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
 * Fixed to use proper nip19 library for bech32 conversion
 */
export function getHexFromNostrUrl(url: string): string | null {
  if (!url.startsWith('nostr:')) return null;
  
  const parts = url.split(':');
  if (parts.length < 2) return null;
  
  const identifier = parts[1];
  
  try {
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
  } catch (error) {
    console.error("Error converting nostr URL to hex:", error);
    return null;
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
  try {
    // Convert to note1 format if it's a hex ID
    const noteIdToUse = noteId.startsWith('note1') 
      ? noteId 
      : nip19.noteEncode(noteId);
      
    return `/post/${noteIdToUse}`;
  } catch (error) {
    console.error("Error generating event URL:", error);
    return `/post/${noteId}`;
  }
}

/**
 * Determines if a string is a valid nostr: URL
 */
export function isNostrUrl(text: string): boolean {
  return NOSTR_URI_REGEX.test(text);
}

/**
 * Get profile picture URL for a pubkey
 */
export async function getProfilePictureFromPubkey(pubkey: string): Promise<string | null> {
  try {
    const profile = await unifiedProfileService.getProfile(pubkey);
    return profile?.picture || null;
  } catch (error) {
    console.error("Error getting profile picture:", error);
    return null;
  }
}
