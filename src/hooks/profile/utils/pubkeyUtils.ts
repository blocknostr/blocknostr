
import { nostrService } from '@/lib/nostr';

/**
 * Convert an npub to hex pubkey, handling various input formats
 * @param input The input pubkey (npub or hex format)
 * @returns The hex pubkey or null if invalid
 */
export const getHexPubkey = (input: string | undefined): string | null => {
  if (!input) return null;
  
  try {
    // If input is already in hex format (64 chars)
    if (input.length === 64 && /^[0-9a-f]+$/i.test(input)) {
      return input;
    }
    
    // If input starts with npub1, convert to hex
    if (input.startsWith('npub1')) {
      return nostrService.getHexFromNpub(input);
    }
    
    // Try to convert, assuming it's npub1 format
    return nostrService.getHexFromNpub(input);
  } catch (error) {
    console.error("Invalid pubkey format:", error);
    return null;
  }
};

/**
 * Determine if a profile belongs to the current user
 * @param hexNpub The profile's hex pubkey
 * @param currentUserPubkey The current user's hex pubkey
 * @returns Whether this is the current user's profile
 */
export const isCurrentUserProfile = (
  hexNpub: string | null, 
  currentUserPubkey: string | null
): boolean => {
  return !!currentUserPubkey && !!hexNpub && hexNpub === currentUserPubkey;
};
