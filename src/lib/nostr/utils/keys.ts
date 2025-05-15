
import { nip19 } from 'nostr-tools';

/**
 * Format a pubkey for display
 * @param pubkey The public key to format
 * @returns The formatted pubkey
 */
export function formatPubkey(pubkey: string): string {
  if (!pubkey) return '';
  
  if (pubkey.startsWith('npub1')) {
    return pubkey.slice(0, 8) + '...' + pubkey.slice(-4);
  }
  
  return pubkey.slice(0, 6) + '...' + pubkey.slice(-4);
}

/**
 * Check if a string is a valid hex pubkey
 * @param pubkey The pubkey to check
 * @returns Whether it's a valid hex pubkey
 */
export function isValidHexPubkey(pubkey: string): boolean {
  if (!pubkey) return false;
  
  // Hex pubkeys are 64 characters of hex
  return /^[0-9a-f]{64}$/i.test(pubkey);
}

/**
 * Check if a string is a valid npub
 * @param pubkey The pubkey to check
 * @returns Whether it's a valid npub
 */
export function isValidNpub(pubkey: string): boolean {
  if (!pubkey || !pubkey.startsWith('npub1')) return false;
  
  try {
    // Try to decode it - if it succeeds, it's valid
    const decoded = nip19.decode(pubkey);
    return decoded.type === 'npub';
  } catch {
    return false;
  }
}

/**
 * Convert a hex pubkey to npub format
 * @param hexPubkey The hex pubkey to convert
 * @returns The npub
 */
export function getNpubFromHex(hexPubkey: string): string {
  try {
    return nip19.npubEncode(hexPubkey);
  } catch (error) {
    console.error("Error converting hex to npub:", error);
    return hexPubkey;
  }
}

/**
 * Convert an npub to hex format
 * @param npub The npub to convert
 * @returns The hex pubkey
 */
export function getHexFromNpub(npub: string): string {
  try {
    if (!npub.startsWith('npub1')) return npub;
    
    const { data } = nip19.decode(npub);
    return data as string;
  } catch (error) {
    console.error("Error converting npub to hex:", error);
    return npub;
  }
}
