
import { nip19 } from 'nostr-tools';

/**
 * Validates if a string is a valid hex pubkey format
 * @param hexInput - String to validate as hex pubkey
 * @returns boolean indicating if input is valid hex pubkey
 */
export const isValidHexPubkey = (hexInput: string): boolean => {
  if (!hexInput) return false;
  // Valid hex pubkey is 64 characters (32 bytes) of hex
  return /^[0-9a-f]{64}$/i.test(hexInput);
};

/**
 * Format a hex pubkey to a human-readable format
 * @param pubkey - Hex pubkey
 * @returns Formatted pubkey (npub or shortened hex)
 */
export const formatPubkey = (pubkey: string): string => {
  if (!pubkey) return 'unknown';
  
  // If it's already in npub format, return it
  if (pubkey.startsWith('npub1')) {
    return pubkey;
  }
  
  try {
    // Only attempt to encode if it's a valid hex pubkey
    if (isValidHexPubkey(pubkey)) {
      return nip19.npubEncode(pubkey);
    } else {
      // Return a shortened version for invalid hex pubkeys
      return pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
    }
  } catch (error) {
    console.warn('Error formatting pubkey:', error);
    // Fallback for any encoding errors
    return pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
  }
};

/**
 * Convert a hex pubkey to npub format
 * @param hexPubkey - Hex pubkey
 * @returns npub format or original input if invalid
 */
export const getNpubFromHex = (hexPubkey: string): string => {
  if (!hexPubkey) return 'npub1unknown';
  
  // If already in npub format, return as-is
  if (hexPubkey.startsWith('npub1')) {
    return hexPubkey;
  }
  
  try {
    // Validate hex format before attempting conversion
    if (isValidHexPubkey(hexPubkey)) {
      return nip19.npubEncode(hexPubkey);
    } else {
      console.warn('Invalid hex pubkey format:', hexPubkey);
      // Return a placeholder for invalid formats
      return `npub1invalid_${hexPubkey.substring(0, 8)}`;
    }
  } catch (error) {
    console.error('Error encoding npub:', error);
    // Return a fallback for encoding errors
    return `npub1error_${hexPubkey.substring(0, 8)}`;
  }
};

/**
 * Convert an npub pubkey to hex format
 * @param npub - npub format pubkey
 * @returns hex format or original input if invalid
 */
export const getHexFromNpub = (npub: string): string => {
  if (!npub) return '';
  
  // If not in npub format, return as-is (assuming it's already hex)
  if (!npub.startsWith('npub1')) {
    return npub;
  }
  
  try {
    const { data } = nip19.decode(npub);
    return data as string;
  } catch (error) {
    console.error('Error decoding npub:', error);
    // For invalid npubs, return original to prevent cascading errors
    return npub;
  }
};
