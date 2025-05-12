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
 * Enhanced with retry mechanism and better error handling.
 */
export async function forceRefreshProfile(pubkey: string): Promise<boolean> {
  if (!pubkey) {
    console.error('[PROFILE REFRESH] No pubkey provided');
    return false;
  }

  try {
    console.log(`[PROFILE REFRESH] Forcing refresh for ${pubkey}`);
    // Clear existing cache
    contentCache.cacheProfile(pubkey, null);

    // Ensure at least one relay is connected
    const relays = nostrService.getRelayStatus();
    if (!relays.some(r => r.status === 'connected')) {
      await nostrService.connectToDefaultRelays();
      
      // Verify we have connections after attempt
      const updatedRelays = nostrService.getRelayStatus();
      if (!updatedRelays.some(r => r.status === 'connected')) {
        console.warn('[PROFILE REFRESH] Failed to connect to any relays');
        return false;
      }
    }

    // Fetch fresh profile with timeout
    const fresh = await nostrService.getUserProfile(pubkey, 10000); // 10s timeout
    if (fresh) {
      console.log('[PROFILE REFRESH] Fetched fresh profile:', fresh);
      // Re-cache via a mock kind-0 event
      const evt: Partial<NostrEvent> = {
        kind: 0,
        pubkey,
        content: JSON.stringify(fresh),
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
      };
      contentCache.cacheEvent(evt as NostrEvent);
      
      // Dispatch an event to notify other components
      window.dispatchEvent(new CustomEvent('profileRefreshed', { 
        detail: { pubkey, profile: fresh } 
      }));
      
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
    const resp = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`, { timeout: 5000 });
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
    const resp = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`, { timeout: 5000 });
    if (!resp.ok) return false;
    const data = await resp.json();
    const pubkey = data?.names?.[name];
    const match = pubkey === nostrService.publicKey;
    console.log(`[NIP-05] current-user match: ${match}`);
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
 * Enhanced profile publication with detailed relay feedback.
 */
export async function publishProfileWithFallback(
  unsignedEvent: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'>,
  relayUrls: string[],
  timeoutMs = 10000
): Promise<{
  success: boolean;
  eventId?: string;
  successfulRelays: string[];
  failedRelays: { url: string; error: string }[];
  error?: string;
}> {
  const result: {
    success: boolean;
    eventId?: string;
    successfulRelays: string[];
    failedRelays: { url: string; error: string }[];
    error?: string;
  } = {
    success: false,
    successfulRelays: [],
    failedRelays: [],
  };

  if (!nostrService.publicKey) {
    result.error = 'No public key available';
    return result;
  }

  // Build full unsigned event
  const full: UnsignedEvent = {
    ...unsignedEvent,
    pubkey: nostrService.publicKey,
    created_at: Math.floor(Date.now() / 1000),
  };

  // Compute ID
  const id = getEventHash(full);
  full.id = id;

  try {
    console.log('[PUBLISH] Starting publish with relays:', relayUrls);
    const publishPromises = relayUrls.map(async (url) => {
      try {
        console.log(`[PUBLISH] Publishing to relay: ${url}`);
        const signedEvent = await nostrService.signEvent(full);
        const eventId = await nostrService.publishToRelay(url, signedEvent, timeoutMs);
        console.log(`[PUBLISH] Success on ${url}, eventId: ${eventId}`);
        result.successfulRelays.push(url);
        if (!result.eventId) result.eventId = eventId;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[PUBLISH] Failed on ${url}:`, errorMsg);
        result.failedRelays.push({ url, error: errorMsg });
      }
    });

    await Promise.all(publishPromises);

    if (result.successfulRelays.length > 0) {
      result.success = true;
      window.dispatchEvent(new CustomEvent('profilePublished', {
        detail: { eventId: result.eventId, pubkey: nostrService.publicKey },
      }));
    } else {
      result.error = `Failed to publish to any relays. Errors: ${result.failedRelays
        .map((r) => `${r.url}: ${r.error}`)
        .join(', ')}`;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown publishing error';
    console.error('[PUBLISH] Unexpected error:', result.error);
  }

  return result;
}

/**
 * Register event listeners for profile updates.
 */
export function setupProfileEventListeners() {
  window.addEventListener('profilePublished', (e: any) => {
    const { pubkey, eventId } = e.detail;
    console.log(`[PROFILE] Profile published with event ID: ${eventId}`);
    setTimeout(() => {
      forceRefreshProfile(pubkey);
    }, 1500);
  });

  window.addEventListener('profileRefreshed', (e: any) => {
    const { pubkey, profile } = e.detail;
    console.log(`[PROFILE] Profile refreshed for ${pubkey}`);
    window.dispatchEvent(new CustomEvent('refetchProfile'));
  });
}

// Set up listeners
setupProfileEventListeners();