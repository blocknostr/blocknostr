
import { nip19 } from 'nostr-tools';

/**
 * Format a public key to either hex or npub format
 */
export function formatPubkey(pubkey: string, format: 'hex' | 'npub' = 'npub'): string {
  if (!pubkey) return '';
  
  try {
    if (format === 'npub' && pubkey.length === 64) {
      return nip19.npubEncode(pubkey);
    } else if (format === 'hex' && pubkey.startsWith('npub1')) {
      const { data } = nip19.decode(pubkey);
      return data as string;
    }
  } catch (e) {
    console.error('Error formatting pubkey:', e);
  }
  
  return pubkey;
}

/**
 * Convert a hex public key to npub format
 */
export function getNpubFromHex(hex: string): string {
  try {
    return nip19.npubEncode(hex);
  } catch (e) {
    console.error('Error encoding pubkey:', e);
    return hex;
  }
}

/**
 * Convert an npub public key to hex format
 */
export function getHexFromNpub(npub: string): string {
  try {
    const { data } = nip19.decode(npub);
    return data as string;
  } catch (e) {
    console.error('Error decoding npub:', e);
    return npub;
  }
}
