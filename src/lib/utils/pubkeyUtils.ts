
import { getHexFromNpub, isValidHexPubkey, isValidNpub } from '@/lib/nostr/utils/keys';

/**
 * Convert any valid pubkey format (npub or hex) to hex format
 */
export function convertToHexPubkey(input: string | undefined | null): string | null {
  if (!input) return null;
  
  try {
    // Import the validation functions for consistency
    const { isValidHexPubkey, isValidNpub, getHexFromNpub } = require('@/lib/nostr/utils/keys');
    
    // If input is already in hex format
    if (isValidHexPubkey(input)) {
      return input;
    }
    
    // If input is in npub format
    if (isValidNpub(input)) {
      const hex = getHexFromNpub(input);
      return hex || null; // Return null if conversion failed
    }
    
    // For any other format, try to convert but provide more details on failure
    console.warn("Unrecognized pubkey format:", input);
    return null;
  } catch (error) {
    console.error("Error converting pubkey format:", error);
    return null;
  }
}

/**
 * Determine if a given pubkey belongs to the current user
 */
export function isCurrentUser(pubkey: string | null | undefined, currentUserPubkey: string | null | undefined): boolean {
  if (!pubkey || !currentUserPubkey) return false;
  
  const hexPubkey = convertToHexPubkey(pubkey);
  const hexCurrentUser = convertToHexPubkey(currentUserPubkey);
  
  return hexPubkey === hexCurrentUser;
}
