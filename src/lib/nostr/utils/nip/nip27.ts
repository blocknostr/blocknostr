/**
 * NIP-27: Mentions - Implementation of the Nostr protocol for formatting mentions
 * https://github.com/nostr-protocol/nips/blob/master/27.md
 */

import { NostrEvent } from '@/lib/nostr/types';
import { nip19 } from 'nostr-tools';
import { nip21 } from 'nostr-tools';
import { nip27 } from 'nostr-tools';
import { nip10 } from 'nostr-tools';
import { coreNostrService } from '@/lib/nostr/core-service';

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
    // Convert npub to hex pubkey first
    let pubkey: string;
    if (npub.startsWith('npub1')) {
      const { type, data } = nip19.decode(npub);
      if (type !== 'npub') {
        return shortenIdentifier(npub);
      }
      pubkey = data as string;
    } else {
      pubkey = npub; // Assume it's already hex
    }
    
    // Query for profile metadata (kind 0) events for this pubkey
    const profileEvents = await coreNostrService.queryEvents([
      {
        kinds: [0], // Profile metadata
        authors: [pubkey],
        limit: 1
      }
    ]);
    
    if (profileEvents.length > 0) {
      const profileEvent = profileEvents[0];
      try {
        const profile = JSON.parse(profileEvent.content);
        if (profile && (profile.name || profile.display_name)) {
          return profile.display_name || profile.name;
        }
      } catch (parseError) {
        console.error('Failed to parse profile metadata:', parseError);
      }
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
  } catch (error) {
    console.error("Error converting nostr URL to hex:", error);
    return null;
  }
  
  return null;
}

/**
 * Get profile URL from pubkey or npub
 */
export function getProfileUrl(pubkeyOrNpub: string): string {
  if (pubkeyOrNpub.startsWith('npub1')) {
    // Convert npub to hex if needed, but for now just use it directly
    return `/profile/${pubkeyOrNpub}`;
  }
  
  // Return profile URL for hex pubkey
  return `/profile/${pubkeyOrNpub}`;
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

