
import { nip19 } from 'nostr-tools';

/**
 * Format a hex pubkey to a human-readable format
 * @param pubkey - Hex pubkey
 * @returns Formatted pubkey (npub or shortened hex)
 */
export const formatPubkey = (pubkey: string): string => {
  // If it's already in npub format, return it
  if (pubkey.startsWith('npub1')) {
    return pubkey;
  }
  
  try {
    return nip19.npubEncode(pubkey);
  } catch (error) {
    // If encoding fails, return a shortened version of the hex
    return pubkey.substring(0, 6) + '...' + pubkey.substring(pubkey.length - 6);
  }
};

/**
 * Convert a hex pubkey to npub format
 * @param hexPubkey - Hex pubkey
 * @returns npub format
 */
export const getNpubFromHex = (hexPubkey: string): string => {
  if (hexPubkey.startsWith('npub1')) {
    return hexPubkey;
  }
  
  try {
    return nip19.npubEncode(hexPubkey);
  } catch (error) {
    console.error('Error encoding npub:', error);
    return hexPubkey;
  }
};

/**
 * Convert an npub pubkey to hex format
 * @param npub - npub format pubkey
 * @returns hex format
 */
export const getHexFromNpub = (npub: string): string => {
  if (!npub.startsWith('npub1')) {
    return npub;
  }
  
  try {
    const { data } = nip19.decode(npub);
    return data as string;
  } catch (error) {
    console.error('Error decoding npub:', error);
    return npub;
  }
};
