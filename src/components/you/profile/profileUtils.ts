
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
 * Publish a profile metadata event with improved error handling for subscription issues.
 * Handles both direct publishing and handles POW requirements gracefully.
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
  
  try {
    // Try to use the global publishEvent method with error handling
    console.log('[PUBLISH] Attempting to publish event...');
    
    // Check if relays require POW
    const powRequired = relayUrls.some(url => url.includes('pow') || url.includes('proof-of-work'));
    if (powRequired) {
      console.log('[PUBLISH] Detected POW relay requirements - this may fail');
    }
    
    // Try submitting to specific relays first (might avoid POW requirements)
    for (const url of relayUrls) {
      try {
        // Skip relays known to require POW
        if (url.includes('pow') || url.toLowerCase().includes('proof')) {
          console.log(`[PUBLISH] Skipping POW relay: ${url}`);
          continue;
        }
        
        // Try publishing to this specific relay
        const relay = await nostrService.addRelay(url);
        if (relay) {
          const eventId = await nostrService.publishEvent({
            ...full,
            id
          }, [url]);
          
          if (eventId) {
            console.log(`[PUBLISH] Successfully published to relay: ${url}`);
            // Dispatch event to notify listeners about successful publish
            window.dispatchEvent(new CustomEvent('profilePublished', { 
              detail: { eventId, pubkey: nostrService.publicKey } 
            }));
            return { success: true, error: null };
          }
        }
      } catch (relayError: any) {
        if (relayError.message?.includes('pow:') || relayError.message?.includes('proof-of-work')) {
          console.warn(`[PUBLISH] Relay ${url} requires POW, skipping`);
          continue;
        }
        console.warn(`[PUBLISH] Failed to publish to relay ${url}:`, relayError);
      }
    }
    
    // Fallback to global publish across all connected relays
    try {
      const eventId = await nostrService.publishEvent({
        ...full,
        id
      });
      
      if (eventId) {
        console.log('[PUBLISH] Successfully published via global method');
        // Dispatch event to notify listeners about successful publish
        window.dispatchEvent(new CustomEvent('profilePublished', { 
          detail: { eventId, pubkey: nostrService.publicKey } 
        }));
        return { success: true, error: null };
      } else {
        console.warn('[PUBLISH] Global publish returned no event ID');
        return { success: false, error: 'Failed to publish event - no event ID returned' };
      }
    } catch (globalError: any) {
      console.error('[PUBLISH] Global publish failed:', globalError);
      if (globalError.message?.includes('pow:')) {
        return { success: false, error: 'Relay requires proof-of-work which is not supported' };
      }
      return { success: false, error: `Global publish failed: ${globalError.message || globalError}` };
    }
  } catch (e: any) {
    console.error('[PUBLISH] Error publishing event:', e.message || e);
    
    // Handle specific error cases
    if (e.message?.includes('no active subscription')) {
      console.log('[PUBLISH] No active subscription error - trying to reconnect relays...');
      try {
        // Try reconnecting to relays
        await nostrService.connectToDefaultRelays();
        // Retry the publish once
        try {
          const eventId = await nostrService.publishEvent({
            ...full,
            id
          });
          
          if (eventId) {
            console.log('[PUBLISH] Retry successful after reconnection');
            return { success: true, error: null };
          }
        } catch (retryError) {
          console.error('[PUBLISH] Retry failed:', retryError);
        }
      } catch (reconnectError) {
        console.error('[PUBLISH] Reconnection failed:', reconnectError);
      }
      
      return { success: false, error: 'Connection to relays lost. Please try again.' };
    } else if (e.message?.includes('pow:')) {
      return { success: false, error: 'Relay requires proof-of-work which is not supported' };
    }
    
    return { success: false, error: 'Failed to publish: ' + (e.message || e) };
  }
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
