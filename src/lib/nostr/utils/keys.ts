
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
