
// src/components/you/profile/profileUtils.ts

import { contentCache, nostrService } from '@/lib/nostr';
import { NostrEvent } from '@/lib/nostr/types';
import { getEventHash, type UnsignedEvent, type Event as RawEvent } from 'nostr-tools';

/**
 * Sanitize image URL to ensure it's properly formatted.
 * Handles absolute (http/https), app-relative ("/…") and bare paths.
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';

  // Already absolute?
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // App-relative
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }

  // Bare path → assume relative
  return `${window.location.origin}/${url}`;
}

/**
 * Force refresh a user's profile by clearing cache and fetching new data.
 */
export async function forceRefreshProfile(pubkey: string): Promise<boolean> {
  if (!pubkey) {
    console.error('[PROFILE REFRESH] No pubkey provided');
    return false;
  }

  try {
    console.log(`[PROFILE REFRESH] Forcing refresh for ${pubkey}`);
    // Clear existing cache
    if (contentCache.getProfile(pubkey)) {
      contentCache.cacheProfile(pubkey, null);
    }

    // Ensure at least one relay is connected
    const relays = nostrService.getRelayStatus();
    if (!relays.some(r => r.status === 'connected')) {
      await nostrService.connectToDefaultRelays();
    }

    // Fetch fresh profile (updates cache internally)
    const fresh = await nostrService.getUserProfile(pubkey);
    if (fresh) {
      console.log('[PROFILE REFRESH] Fetched fresh profile:', fresh);
      // Re-cache via a mock kind-0 event if desired
      const evt: Partial<NostrEvent> = {
        kind: 0,
        pubkey,
        content: JSON.stringify(fresh),
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
      };
      contentCache.cacheEvent(evt as NostrEvent);
      return true;
    } else {
      console.warn('[PROFILE REFRESH] No data returned');
      return false;
    }
  } catch (err) {
    console.error('[PROFILE REFRESH] Error:', err);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier exists (not necessarily current user).
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier.includes('@')) {
    console.log('[NIP-05] Bad format:', identifier);
    return false;
  }
  const [name, domain] = identifier.split('@');
  try {
    console.log(`[NIP-05] Fetching https://${domain}/.well-known/nostr.json?name=${name}`);
    const resp = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
    if (!resp.ok) {
      console.log('[NIP-05] HTTP error:', resp.status);
      return false;
    }
    const data = await resp.json();
    const pubkey = data?.names?.[name];
    if (pubkey) {
      console.log(`[NIP-05] Found pubkey for ${identifier}: ${pubkey}`);
      return true;
    }
    console.log('[NIP-05] Name not in response');
    return false;
  } catch (err) {
    console.error('[NIP-05] Error:', err);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier belongs to current user.
 */
export async function verifyNip05ForCurrentUser(identifier: string): Promise<boolean> {
  if (!nostrService.publicKey || !identifier.includes('@')) return false;
  const [name, domain] = identifier.split('@');
  try {
    const resp = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
    if (!resp.ok) return false;
    const data = await resp.json();
    const pubkey = data?.names?.[name];
    const match = pubkey === nostrService.publicKey;
    console.log(`[NIP-05] current‐user match: ${match}`);
    return match;
  } catch {
    return false;
  }
}

/**
 * Simple NIP-05 utility fns
 */
export const nip05Utils = {
  formatIdentifier: (username: string, domain: string) => `${username}@${domain}`,
  parseIdentifier: (id: string) => {
    if (!id.includes('@')) return null;
    const [u, d] = id.split('@');
    return u && d ? { username: u, domain: d } : null;
  },
  isValidFormat: (id: string) => /^\w+@[\w.-]+\.\w+$/.test(id),
};

/**
 * Publish a profile metadata event with fallbacks & explicit signing.
 */
export async function publishProfileWithFallback(
  unsignedEvent: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'>,
  relayUrls: string[]
): Promise<{ success: boolean; error: string | null }> {
  if (!nostrService.publicKey) {
    return { success: false, error: 'No public key available' };
  }

  // Build full unsigned event
  const full: UnsignedEvent = {
    ...unsignedEvent,
    pubkey: nostrService.publicKey,
    created_at: Math.floor(Date.now() / 1000),
  };

  // Compute ID
  const id = getEventHash(full);
  
  let sig: string;
  try {
    // Try to use the global publishEvent method instead of direct signing
    const eventId = await nostrService.publishEvent({
      ...full,
      id
    });
    
    if (eventId) {
      return { success: true, error: null };
    } else {
      return { success: false, error: 'Failed to publish event' };
    }
  } catch (e: any) {
    console.error('[PUBLISH] Error publishing event:', e.message || e);
    return { success: false, error: 'Failed to publish: ' + (e.message || e) };
  }
}
