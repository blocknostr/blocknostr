
import { nostrService } from '@/lib/nostr';
import {
  verifyNip05 as nip05Verify,
  isValidNip05Format,
} from '@/lib/nostr/utils/nip/nip05';
import { isValidHexString } from '@/lib/nostr/utils/keys';
import { contentCache } from '@/lib/nostr/cache/content-cache';

/**
 * Verify a NIP-05 identifier (any user) — returns true if the identifier resolves at all.
 */
export async function verifyNip05Identifier(
  identifier: string
): Promise<boolean> {
  if (!identifier) return false;
  const normalized = identifier.trim().toLowerCase();
  try {
    const result = await nip05Verify(normalized);
    return result !== null;
  } catch (err) {
    console.error('Error verifying NIP-05 identifier:', err);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier specifically for the current user.
 * Returns true only if it resolves and matches nostrService.publicKey.
 */
export async function verifyNip05ForCurrentUser(
  identifier: string
): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  const normalized = identifier.trim().toLowerCase();
  try {
    const result = await nip05Verify(normalized);
    return (
      result !== null &&
      isValidHexString(result) &&
      result === nostrService.publicKey
    );
  } catch (err) {
    console.error('Error verifying NIP-05 for current user:', err);
    return false;
  }
}

/**
 * Force-clear cache & refresh a NIP-01 metadata event for a given pubkey.
 */
export async function forceRefreshProfile(pubkey: string): Promise<void> {
  if (!pubkey) return;

  try {
    console.log(`Clearing cached profile for ${pubkey}…`);
    if (contentCache.getProfile(pubkey)) {
      contentCache.cacheProfile(pubkey, null);
    }

    console.log(`Fetching fresh profile for ${pubkey}…`);
    await nostrService.getUserProfile(pubkey);

    console.log(`Profile refresh completed for ${pubkey}.`);
  } catch (err) {
    console.error(`Error refreshing profile for ${pubkey}:`, err);
    throw err;
  }
}

/**
 * Additional NIP-05 utilities.
 */
export const nip05Utils = {
  formatIdentifier: (id: string): string =>
    id.trim().toLowerCase(),
  isValidFormat: (id: string): boolean =>
    isValidNip05Format(id),
};
