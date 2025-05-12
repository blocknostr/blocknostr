
import { nostrService } from '@/lib/nostr';
import { verifyNip05 } from '@/lib/nostr/utils/nip/nip05';

/**
 * Utilities for profile management
 */

/**
 * Verify a NIP-05 identifier for the user
 * @param identifier NIP-05 identifier to verify
 * @returns Promise that resolves to boolean indicating verification status
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier) return false;
  
  try {
    // Verify using the general NIP-05 verification utility
    return await verifyNip05(identifier);
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * NIP-05 utilities
 */
export const nip05Utils = {
  /**
   * Format a NIP-05 identifier (trim whitespace, lowercase)
   */
  formatIdentifier: (identifier: string): string => {
    if (!identifier) return '';
    return identifier.trim().toLowerCase();
  }
};
