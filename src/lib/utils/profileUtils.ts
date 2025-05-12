
import { nostrService } from '@/lib/nostr';

/**
 * Converts a possible npub to hex format
 * @param input String that might be npub or hex
 * @returns Hex format of the pubkey or null if invalid
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
 * Determines if a given npub represents the current user
 */
export const isCurrentUserProfile = (npub: string | undefined, currentUserPubkey: string | null): boolean => {
  if (!npub || !currentUserPubkey) return false;
  const hexNpub = getHexPubkey(npub);
  return hexNpub === currentUserPubkey;
};
