
// src/components/you/profile/profileUtils.ts

import { contentCache, nostrService } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { NostrEvent } from '@/lib/nostr/types';
import { getEventHash, type UnsignedEvent, type Event as RawEvent } from 'nostr-tools';

/**
 * Safely encodes URI components to prevent malformed URI errors
 */
function safeEncodeURIComponent(component: string): string {
  try {
    return encodeURIComponent(component);
  } catch (error) {
    console.error('[URL ENCODING] Error encoding component:', component, error);
    return '';
  }
}

/**
 * Sanitize image URL to ensure it's properly formatted.
 * Handles absolute (http/https), app-relative ("/…") and bare paths.
 * Includes additional safety for malformed URIs.
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';

  try {
    // Already absolute?
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      // Verify it's a valid URL by attempting to construct a URL object
      try {
        new URL(url);
        return url;
      } catch (e) {
        console.warn('[URL SANITIZE] Invalid absolute URL:', url);
        return '';
      }
    }

    // App-relative
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }

    // Bare path → assume relative
    // Handle potential special characters by encoding the path portion
    const safePath = safeEncodeURIComponent(url).replace(/%2F/g, '/');
    return `${window.location.origin}/${safePath}`;
  } catch (error) {
    console.error('[URL SANITIZE] Error processing URL:', url, error);
    return '';
  }
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
    if (contentCache.getProfile(pubkey)) {
      contentCache.cacheProfile(pubkey, null);
    }

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

    // Fetch fresh profile (updates cache internally)
    const fresh = await nostrService.getUserProfile(pubkey);
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

      // Dispatch an event to notify other components that profile data was refreshed
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
    // Use AbortController for timeout instead of the 'timeout' property
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`, {
        signal: controller.signal
      });

      if (!resp.ok) return false;
      const data = await resp.json();
      const pubkey = data?.names?.[name];
      const match = pubkey === nostrService.publicKey;
      console.log(`[NIP-05] current‐user match: ${match}`);
      return match;
    } finally {
      clearTimeout(timeoutId);
    }
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
 * Enhanced profile publication with improved error handling for various Nostr relay issues.
 * Handles both direct publishing and manages POW requirements gracefully.
 */
export async function publishProfileWithFallback(
  unsignedEvent: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'>,
  relayUrls: string[]
): Promise<{ success: boolean; error: string | null; eventId?: string }> {
  if (!nostrService.publicKey) {
    return { success: false, error: 'No public key available' };
  }

  try {
    // Validate content before publishing
    // Check if content is valid JSON for kind 0 events
    if (unsignedEvent.kind === 0) {
      try {
        const contentObj = JSON.parse(unsignedEvent.content);
        
        // Sanitize URLs in the profile data
        if (contentObj.picture) {
          contentObj.picture = sanitizeImageUrl(contentObj.picture);
        }
        if (contentObj.banner) {
          contentObj.banner = sanitizeImageUrl(contentObj.banner);
        }
        
        // Update content with sanitized values
        unsignedEvent = {
          ...unsignedEvent,
          content: JSON.stringify(contentObj)
        };
      } catch (e) {
        console.error('[PUBLISH] Invalid JSON in event content:', e);
        return { success: false, error: 'Invalid profile data format' };
      }
    }

    // Build full unsigned event
    const full: UnsignedEvent = {
      ...unsignedEvent,
      pubkey: nostrService.publicKey,
      created_at: Math.floor(Date.now() / 1000),
    };

    // Compute ID
    const eventId = getEventHash(full);

    console.log('[PUBLISH] Attempting to publish event with tryPublishWithRetries...');

    // Verify relay reachability before publishing
    const reachableRelays = await Promise.all(
      relayUrls.map(async (url) => {
        try {
          // Use the new pingRelay method from adaptedNostrService
          const isReachable = await adaptedNostrService.pingRelay(url);
          if (isReachable) {
            console.log(`[PUBLISH] Relay reachable: ${url}`);
            return url;
          } else {
            console.warn(`[PUBLISH] Relay not reachable: ${url}`);
            return null;
          }
        } catch (error) {
          console.error(`[PUBLISH] Error pinging relay ${url}:`, error);
          return null;
        }
      })
    );

    const validRelays = reachableRelays.filter((url): url is string => url !== null);

    if (validRelays.length === 0) {
      console.error('[PUBLISH] No reachable relays available');
      return { success: false, error: 'No reachable relays available' };
    }

    // Try our enhanced publish function with retries
    const result = await tryPublishWithRetries({
      ...full,
      eventHash: eventId
    }, validRelays);

    if (result.success) {
      // Dispatch event to notify listeners about successful publish
      window.dispatchEvent(new CustomEvent('profilePublished', {
        detail: { eventId: result.eventId, pubkey: nostrService.publicKey }
      }));
      return { success: true, error: null, eventId: result.eventId };
    }

    // If we got here, all methods failed
    return {
      success: false,
      error: result.error || 'Failed to publish after multiple attempts',
      eventId: result.eventId
    };
  } catch (e: any) {
    console.error('[PUBLISH] Unexpected error in publishProfileWithFallback:', e);
    return { success: false, error: 'Unexpected error: ' + (e.message || e) };
  }
}

/**
 * Helper function to try different publishing strategies with retries
 */
async function tryPublishWithRetries(
  event: UnsignedEvent & { eventHash: string },
  relayUrls: string[]
): Promise<{ success: boolean; error: string | null; eventId?: string }> {
  // First attempt: Try direct publishing to each relay individually
  console.log('[PUBLISH] Attempting direct publishing to individual relays first');

  // Filter out relays that might require POW
  const nonPowRelays = relayUrls.filter(url =>
    !url.includes('pow') &&
    !url.toLowerCase().includes('proof') &&
    !url.includes('nostr.band')  // Known to require PoW
  );

  // Try each non-POW relay
  for (const url of nonPowRelays) {
    try {
      console.log(`[PUBLISH] Trying to publish to relay: ${url}`);

      // Try publishing to this specific relay
      const relay = await nostrService.addRelay(url);
      if (relay) {
        let eventId: string | undefined;

        try {
          // Try the first attempt - use standard publishEvent method
          eventId = await nostrService.publishEvent({
            ...event
          });

          if (eventId) {
            console.log(`[PUBLISH] Successfully published to relay: ${url} with eventId: ${eventId}`);
            return { success: true, error: null, eventId };
          }
        } catch (relayError: any) {
          // Handle specific errors
          if (relayError.message?.includes('no active subscription')) {
            console.log(`[PUBLISH] No active subscription for ${url}, reconnecting...`);

            // Try reconnecting to this relay
            await nostrService.removeRelay(url);
            await new Promise(resolve => setTimeout(resolve, 500));
            await nostrService.addRelay(url);

            // Try publishing again after reconnection
            try {
              eventId = await nostrService.publishEvent({
                ...event
              });

              if (eventId) {
                console.log(`[PUBLISH] Successfully published to relay: ${url} after reconnection`);
                return { success: true, error: null, eventId };
              }
            } catch (retryError) {
              console.warn(`[PUBLISH] Second attempt to ${url} failed:`, retryError);
            }
          } else if (relayError.message?.includes('pow:') || relayError.message?.includes('proof-of-work')) {
            console.warn(`[PUBLISH] Relay ${url} requires POW, skipping:`, relayError.message);
            continue;
          }
        }
      }
    } catch (relayError: any) {
      console.warn(`[PUBLISH] Failed to publish to relay ${url}:`, relayError);
    }
  }

  // Second attempt: Try global publish method with reconnection
  console.log('[PUBLISH] Trying global publish method');
  try {
    // Ensure we have some connections
    const relayStatus = nostrService.getRelayStatus();
    if (!relayStatus.some(r => r.status === 'connected')) {
      console.log('[PUBLISH] No connected relays, attempting to reconnect...');
      await nostrService.connectToDefaultRelays();
    }

    // Try global publish
    const eventId = await nostrService.publishEvent({
      ...event
    });

    if (eventId) {
      console.log('[PUBLISH] Successfully published via global method');
      return { success: true, error: null, eventId };
    }
  } catch (globalError: any) {
    console.error('[PUBLISH] Global publish attempt failed:', globalError);

    // Special case for subscription errors
    if (globalError.message?.includes('no active subscription')) {
      // Try reconnecting to all relays
      console.log('[PUBLISH] No active subscription error, reconnecting to all relays...');
      try {
        await nostrService.connectToDefaultRelays();

        // Wait a moment for connections to establish
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try publishing once more
        try {
          const eventId = await nostrService.publishEvent({
            ...event
          });

          if (eventId) {
            console.log('[PUBLISH] Successfully published after reconnection');
            return { success: true, error: null, eventId };
          }
        } catch (finalError: any) {
          if (finalError.message?.includes('pow:')) {
            return { success: false, error: 'Relay requires proof-of-work which is not supported' };
          }
          return { success: false, error: `Final attempt failed: ${finalError.message || finalError}` };
        }
      } catch (reconnectError) {
        console.error('[PUBLISH] Reconnection failed:', reconnectError);
        return { success: false, error: 'Failed to reconnect to relays' };
      }
    } else if (globalError.message?.includes('pow:')) {
      return { success: false, error: 'Relay requires proof-of-work which is not supported' };
    }
  }

  // If we got here, all methods failed
  return { success: false, error: 'Failed to publish event after multiple attempts' };
}

/**
 * Register event listeners for profile updates.
 * This allows components to react to profile changes.
 */
export function setupProfileEventListeners() {
  // Listen for profile published events
  window.addEventListener('profilePublished', (e: any) => {
    const { pubkey, eventId } = e.detail;
    console.log(`[PROFILE] Profile published with event ID: ${eventId}`);

    // Force refresh after a short delay to allow propagation
    if (pubkey) {
      setTimeout(() => {
        forceRefreshProfile(pubkey);
      }, 1500);
    }
  });

  // Listen for profile refreshed events
  window.addEventListener('profileRefreshed', (e: any) => {
    const { pubkey, profile } = e.detail;
    console.log(`[PROFILE] Profile refreshed for ${pubkey}`);

    // Dispatch a general UI refresh event
    window.dispatchEvent(new CustomEvent('refetchProfile'));
  });
}

// Set up listeners when this module is imported
setupProfileEventListeners();
