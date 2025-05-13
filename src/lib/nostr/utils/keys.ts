
import { nip19 } from 'nostr-tools';

/**
 * Format a hex pubkey to a human-readable format
 * @param pubkey - Hex pubkey
 * @returns Formatted pubkey (npub or shortened hex)
 */
export const formatPubkey = (pubkey: string): string => {
  // If empty or invalid, return a safe default
  if (!pubkey || typeof pubkey !== 'string') {
    return 'unknown';
  }
  
  // If it's already in npub format, return it
  if (pubkey.startsWith('npub1')) {
    return pubkey;
  }
  
  try {
    // Check if it's a valid hex pubkey (should be 64 chars)
    if (pubkey.length !== 64 || !/^[0-9a-f]+$/i.test(pubkey)) {
      return pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
    }
    
    return nip19.npubEncode(pubkey);
  } catch (error) {
    console.error('Error formatting pubkey:', error);
    // If encoding fails, return a shortened version of the hex
    return pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
  }
};

/**
 * Convert a hex pubkey to npub format
 * @param hexPubkey - Hex pubkey
 * @returns npub format or original string if conversion fails
 */
export const getNpubFromHex = (hexPubkey: string): string => {
  // If empty or invalid type, return a safe default
  if (!hexPubkey || typeof hexPubkey !== 'string') {
    return 'npub1unknown';
  }
  
  // If it's already in npub format, return it
  if (hexPubkey.startsWith('npub1')) {
    return hexPubkey;
  }
  
  try {
    // Check if it's a valid hex pubkey (should be 64 chars)
    if (hexPubkey.length !== 64 || !/^[0-9a-f]+$/i.test(hexPubkey)) {
      throw new Error('Invalid hex pubkey format');
    }
    
    return nip19.npubEncode(hexPubkey);
  } catch (error) {
    console.error('Error encoding npub:', error);
    // Return original input as fallback
    return hexPubkey;
  }
};

/**
 * Convert an npub pubkey to hex format
 * @param npub - npub format pubkey
 * @returns hex format or original string if conversion fails
 */
export const getHexFromNpub = (npub: string): string => {
  // If empty or invalid type, return a safe default
  if (!npub || typeof npub !== 'string') {
    return '';
  }
  
  // If not an npub, assume it might be hex already
  if (!npub.startsWith('npub1')) {
    return npub;
  }
  
  try {
    const { data } = nip19.decode(npub);
    return data as string;
  } catch (error) {
    console.error('Error decoding npub:', error);
    // Return original input as fallback
    return npub;
  }
};
