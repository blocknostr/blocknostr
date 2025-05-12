
import { verifyNip05, verifyNip05ForPubkey, isValidNip05Format, formatNip05 } from '@/lib/nostr/utils/nip/nip05';
import { nostrService } from '@/lib/nostr';

/**
 * Verifies a NIP-05 identifier against the current user's pubkey
 * @param identifier The NIP-05 identifier to verify (in format local-part@domain.tld)
 * @returns True if the identifier resolves to the current user's pubkey
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  
  try {
    // Verify that the NIP-05 identifier resolves to the current user's pubkey
    return await verifyNip05ForPubkey(identifier, nostrService.publicKey);
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Provides utility functions for working with NIP-05 identifiers
 */
export const nip05Utils = {
  isValidFormat: isValidNip05Format,
  format: formatNip05,
  verify: verifyNip05,
  verifyForCurrentUser: verifyNip05Identifier
};
