// src/components/you/profile/profileUtils.ts

import { getEventHash, type UnsignedEvent, type Event as NostrEvent } from 'nostr-tools';
import { nip05Verify } from '@/lib/nostr/utils/nip/nip05';
import { isValidHexString } from '@/lib/nostr/utils/keys';
import { contentCache } from '@/lib/nostr/cache/content-cache';
import { nostrService } from '@/lib/nostr';

/**
 * Verify a NIP-05 identifier (any user) — returns true if the identifier resolves.
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier) return false;
  const normalized = identifier.trim().toLowerCase();
  try {
    const result = await nip05Verify(normalized);
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Verify a NIP-05 identifier for the current user.
 */
export async function verifyNip05ForCurrentUser(identifier: string): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  const normalized = identifier.trim().toLowerCase();
  try {
    const result = await nip05Verify(normalized);
    return result !== null && isValidHexString(result) && result === nostrService.publicKey;
  } catch {
    return false;
  }
}

/**
 * Sanitize a user-provided image URL to enforce HTTPS and data URLs.
 */
export function sanitizeImageUrl(url: string): string {
  if (url.startsWith('http://')) {
    return url.replace(/^http:\/\//, 'https://');
  }
  // allow data: and https:
  if (url.startsWith('data:') || url.startsWith('https://')) {
    return url;
  }
  // otherwise drop
  return '';
}

/**
 * Force-clear cache & refresh a NIP-01 metadata event for a given pubkey.
 */
export async function forceRefreshProfile(pubkey: string): Promise<void> {
  // clear cache
  if (contentCache.getProfile(pubkey)) {
    contentCache.cacheProfile(pubkey, null);
  }
  // fetch fresh
  await nostrService.getUserProfile(pubkey);
}

/**
 * Publish a profile metadata event, attempting on each relay URL in order.
 * Automatically builds a complete event (id, sig) from the unsigned payload.
 */
export async function publishProfileWithFallback(
  unsigned: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'>,
  relayUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!nostrService.publicKey) {
    return { success: false, error: 'No public key available' };
  }

  // Build full event
  const fullUnsigned: UnsignedEvent = {
    ...unsigned,
    pubkey: nostrService.publicKey,
    created_at: Math.floor(Date.now() / 1000),
  };

  // Compute id
  const id = getEventHash(fullUnsigned);
  // Sign
  let sig: string;
  try {
    sig = await nostrService.signEvent(fullUnsigned);
  } catch (e: any) {
    return { success: false, error: 'Failed to sign event: ' + e.message };
  }
  const event: NostrEvent = { ...fullUnsigned, id, sig };

  // Attempt publish on each relay until one succeeds
  for (const url of relayUrls) {
    try {
      const ok = await nostrService.publishEventToRelay(event, url);
      if (ok) {
        return { success: true };
      }
    } catch (e: any) {
      console.warn(`Publish to ${url} failed:`, e.message ?? e);
    }
  }

  // Fallback: try default publish (which may broadcast to all)
  try {
    const ok = await nostrService.publishEvent(event);
    if (ok) return { success: true };
  } catch (e: any) {
    console.error('Default publish failed:', e.message ?? e);
  }

  return { success: false, error: 'Invalid event data or no relay accepted it' };
}

/**
 * NIP-05 utility checks
 */
export const nip05Utils = {
  formatIdentifier: (id: string) => id.trim().toLowerCase(),
  isValidFormat: (id: string) => /^\w+@[\w.-]+\.\w+$/.test(id),
};