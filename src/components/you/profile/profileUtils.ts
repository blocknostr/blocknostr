
import { nostrService } from '@/lib/nostr';
import { verifyNip05 as nip05Verify, isValidNip05Format } from '@/lib/nostr/utils/nip/nip05';

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
    const pubkeyHex = await nip05Verify(identifier);
    return !!pubkeyHex; // Convert to boolean - true if a valid pubkey was returned
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier matches the current user's public key
 * @param identifier NIP-05 identifier to verify
 * @returns Promise that resolves to boolean indicating if the identifier matches the current user
 */
export async function verifyNip05ForCurrentUser(identifier: string): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  
  try {
    const pubkeyHex = await nip05Verify(identifier);
    // Fix the comparison - pubkeyHex will be a string (or null), not a boolean
    return pubkeyHex !== null && pubkeyHex === nostrService.publicKey;
  } catch (error) {
    console.error("Error verifying NIP-05 for current user:", error);
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
  },

  /**
   * Check if a string is in valid NIP-05 format
   */
  isValidFormat: (identifier: string): boolean => {
    return isValidNip05Format(identifier);
  }
};
