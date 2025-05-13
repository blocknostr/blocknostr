
import { nostrService } from '@/lib/nostr';

/**
 * Convert any valid pubkey format (npub or hex) to hex format
 */
export function convertToHexPubkey(input: string | undefined | null): string | null {
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
    
    // For any other format, try to convert
    try {
      return nostrService.getHexFromNpub(input);
    } catch (e) {
      console.warn("Unrecognized pubkey format:", input);
      return input; // Return as-is as fallback
    }
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
