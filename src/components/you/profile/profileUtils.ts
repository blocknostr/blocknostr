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

  // Build full unsigned event
  const full: UnsignedEvent = {
    ...unsignedEvent,
    pubkey: nostrService.publicKey,
    created_at: Math.floor(Date.now() / 1000),
  };

  // Compute ID
  const eventId = getEventHash(full);
  
  try {
    console.log('[PUBLISH] Attempting to publish event with tryPublishWithRetries...');
    
    // Filter out relays that might require POW before attempting
    const nonPowRelays = relayUrls.filter(url => 
      !url.includes('pow') && 
      !url.toLowerCase().includes('proof') &&
      !url.includes('nostr.band')  // Known to require PoW
    );
    
    if (nonPowRelays.length === 0) {
      // Add some known non-POW relays if all our relays might require POW
      nonPowRelays.push(
        "wss://relay.damus.io", 
        "wss://nos.lol",
        "wss://relay.snort.social",
        "wss://nostr.mom",
        "wss://relay.current.fyi"
      );
    }
    
    // Try our enhanced publish function with retries
    const result = await tryPublishWithRetries({
      ...full,
      eventHash: eventId
    }, nonPowRelays);
    
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
  
  // Try each relay with fresh connections
  for (const url of relayUrls) {
    try {
      console.log(`[PUBLISH] Trying to publish to relay: ${url}`);
      
      // Ensure we have a fresh connection to this relay
      try {
        await nostrService.removeRelay(url);
        await new Promise(resolve => setTimeout(resolve, 300));
        const relay = await nostrService.addRelay(url);
        
        if (!relay) {
          console.warn(`[PUBLISH] Failed to connect to relay: ${url}`);
          continue;
        }
        
        // Wait a moment for the connection to establish properly
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (connError) {
        console.warn(`[PUBLISH] Connection error to relay ${url}:`, connError);
        continue;
      }
      
      // Try publishing with a fresh subscription
      try {
        const eventId = await nostrService.publishEvent({
          ...event
        });
        
        if (eventId) {
          console.log(`[PUBLISH] Successfully published to relay: ${url} with eventId: ${eventId}`);
          return { success: true, error: null, eventId };
        }
      } catch (relayError: any) {
        // Handle specific errors
        if (relayError.message?.includes('no active subscription')) {
          console.log(`[PUBLISH] No active subscription for ${url}, will try next relay`);
          continue;
        } else if (relayError.message?.includes('pow:') || relayError.message?.includes('proof-of-work')) {
          console.warn(`[PUBLISH] Relay ${url} requires POW, skipping:`, relayError.message);
          continue;
        } else {
          console.warn(`[PUBLISH] Error publishing to ${url}:`, relayError.message || relayError);
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
      
      // Wait a moment for connections to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    
    // Handle specific errors
    if (globalError.message?.includes('pow:') || globalError.message?.includes('proof-of-work')) {
      return { success: false, error: 'Relay requires proof-of-work which is not supported. Try adding a non-POW relay.' };
    } else if (globalError.message?.includes('no active subscription')) {
      return { success: false, error: 'Connection to relay was lost. Try refreshing the page and adding different relays.' };
    }
  }
  
  // If we got here, all methods failed
  return { success: false, error: 'Failed to publish event after multiple attempts. Try adding more relays.' };
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
