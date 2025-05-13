
/**
 * NIP-44: Versioned Encryption
 * Implements the versioned encryption specification defined in NIP-44
 * See: https://github.com/nostr-protocol/nips/blob/master/44.md
 */
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { schnorr } from '@noble/curves/secp256k1';
import * as secp from '@noble/secp256k1';
import { xchacha20 } from '@noble/ciphers/chacha';
import * as utils from '@noble/curves/abstract/utils';

export const VERSION = 0;
export const DEFAULT_CACHE_SIZE = 1000;

// Utility function for secure key conversion
function secp256k1SharedSecret(privateKey: string, publicKey: string): Uint8Array {
  try {
    // Make sure the public key is in compact format
    const publicKeyBytes = hexToBytes(publicKey.length === 64 ? publicKey : publicKey.slice(2));
    const sharedPoint = secp.getSharedSecret(privateKey, '02' + bytesToHex(publicKeyBytes));
    return sharedPoint.slice(1, 33);
  } catch (e) {
    console.error('Error calculating shared secret:', e);
    throw new Error('Invalid keys for shared secret calculation');
  }
}

interface EncryptArgs {
  plaintext: string;
  privateKey: string;
  publicKey: string;
}

export function encrypt({ plaintext, privateKey, publicKey }: EncryptArgs): string {
  try {
    // Convert text to bytes
    const plaintextBytes = new TextEncoder().encode(plaintext);
    
    // Generate shared secret
    const sharedSecret = secp256k1SharedSecret(privateKey, publicKey);
    
    // Generate random nonce
    const nonce = utils.randomBytes(24);
    
    // Prepare cipher with shared secret and nonce
    const cipher = xchacha20(sharedSecret, nonce);
    
    // Encrypt the plaintext
    const ciphertext = cipher.seal(plaintextBytes);
    
    // Combine version byte, nonce, and ciphertext
    const payload = new Uint8Array(1 + nonce.length + ciphertext.length);
    payload[0] = VERSION;
    payload.set(nonce, 1);
    payload.set(ciphertext, 1 + nonce.length);
    
    // Return Base64-encoded payload
    return btoa(String.fromCharCode(...payload));
  } catch (e) {
    console.error('Encryption error:', e);
    throw new Error('Failed to encrypt message');
  }
}

interface DecryptArgs {
  ciphertext: string;
  privateKey: string;
  publicKey: string;
}

export function decrypt({ ciphertext, privateKey, publicKey }: DecryptArgs): string {
  try {
    // Decode Base64 to bytes
    const payload = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract version, nonce, and ciphertext
    const version = payload[0];
    if (version !== VERSION) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }
    
    const nonce = payload.slice(1, 25);
    const encryptedData = payload.slice(25);
    
    // Generate shared secret
    const sharedSecret = secp256k1SharedSecret(privateKey, publicKey);
    
    // Prepare cipher for decryption
    const cipher = xchacha20(sharedSecret, nonce);
    
    // Decrypt the ciphertext
    const decrypted = cipher.open(encryptedData);
    if (!decrypted) {
      throw new Error('Decryption failed: Invalid ciphertext or corrupted data');
    }
    
    // Convert bytes back to text
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error('Decryption error:', e);
    throw new Error('Failed to decrypt message');
  }
}
