
import { nip19 } from 'nostr-tools';

// Cache for converted pubkeys to avoid recalculating
const npubCache = new Map<string, string>();
const hexCache = new Map<string, string>();

/**
 * Check if a string is a valid hex pubkey format
 * @param input - String to check
 * @returns Boolean indicating if the input is a valid hex pubkey
 */
export const isValidHexPubkey = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  return input.length === 64 && /^[0-9a-f]{64}$/i.test(input);
};

/**
 * Check if a string is a valid npub format
 * @param input - String to check
 * @returns Boolean indicating if the input is a valid npub format
 */
export const isValidNpub = (input: string): boolean => {
  if (!input || typeof input !== 'string') return false;
  return input.startsWith('npub1') && input.length >= 60;
};

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
  if (isValidNpub(pubkey)) {
    return pubkey;
  }
  
  // Check cache first
  if (npubCache.has(pubkey)) {
    return npubCache.get(pubkey) || 'unknown';
  }
  
  try {
    // Check if it's a valid hex pubkey
    if (!isValidHexPubkey(pubkey)) {
      // Return a shortened version for display purposes
      const shortened = pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
      return shortened;
    }
    
    const npub = nip19.npubEncode(pubkey);
    // Cache the result
    npubCache.set(pubkey, npub);
    return npub;
  } catch (error) {
    console.error('Error formatting pubkey:', error);
    // If encoding fails, return a shortened version of the hex
    const shortened = pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
    return shortened;
  }
};

/**
 * Convert a hex pubkey to npub format with enhanced validation and caching
 * @param hexPubkey - Hex pubkey
 * @returns npub format or original string if conversion fails
 */
export const getNpubFromHex = (hexPubkey: string): string => {
  // If empty or invalid type, return a safe default
  if (!hexPubkey || typeof hexPubkey !== 'string') {
    return 'npub1unknown';
  }
  
  // If it's already in npub format, validate and return it
  if (isValidNpub(hexPubkey)) {
    return hexPubkey;
  }
  
  // Check cache first
  if (npubCache.has(hexPubkey)) {
    return npubCache.get(hexPubkey) || 'npub1unknown';
  }
  
  try {
    // Validate hex format before attempting conversion
    if (!isValidHexPubkey(hexPubkey)) {
      console.warn('Invalid hex pubkey format:', hexPubkey);
      // Return a consistent prefix for invalid keys
      return 'npub1invalid';
    }
    
    const npub = nip19.npubEncode(hexPubkey);
    // Cache the result
    npubCache.set(hexPubkey, npub);
    return npub;
  } catch (error) {
    console.error('Error encoding npub:', error, 'input:', hexPubkey);
    // Return a consistent error format for debugging
    return 'npub1error';
  }
};

/**
 * Convert an npub pubkey to hex format with enhanced validation and caching
 * @param npub - npub format pubkey
 * @returns hex format or empty string if conversion fails
 */
export const getHexFromNpub = (npub: string): string => {
  // If empty or invalid type, return a safe default
  if (!npub || typeof npub !== 'string') {
    return '';
  }
  
  // If not an npub, check if it's already a valid hex
  if (!npub.startsWith('npub1')) {
    return isValidHexPubkey(npub) ? npub : '';
  }
  
  // Check cache first
  if (hexCache.has(npub)) {
    return hexCache.get(npub) || '';
  }
  
  // Validate npub format before attempting conversion
  if (!isValidNpub(npub)) {
    console.warn('Invalid npub format:', npub);
    return '';
  }
  
  try {
    const { type, data } = nip19.decode(npub);
    
    // Check if the decoded result is actually a pubkey
    if (type !== 'npub') {
      console.warn('Decoded type is not a pubkey:', type);
      return '';
    }
    
    const hexPubkey = data as string;
    // Cache the result
    hexCache.set(npub, hexPubkey);
    return hexPubkey;
  } catch (error) {
    console.error('Error decoding npub:', error, 'input:', npub);
    return '';
  }
};

