
import { getPublicKey, generatePrivateKey, nip04 } from 'nostr-tools';
import * as secp from '@noble/secp256k1';
import { randomBytes } from '@noble/hashes/utils';
import { xchacha20, xchacha20_seal, xchacha20_open } from '@noble/ciphers/chacha';
import { sha256 } from '@noble/hashes/sha256';

/**
 * Implementation of NIP-44: Encrypted Payloads with AEAD
 * Spec: https://github.com/nostr-protocol/nips/blob/master/44.md
 * 
 * This implementation uses XChaCha20-Poly1305 for symmetric encryption
 * with a shared secret derived using ECDH.
 */

// Version byte for NIP-44 encrypted messages
const VERSION_BYTE = 0x02;

/**
 * Generate a shared secret from a private key and a public key
 * 
 * @param privateKey - Hex-encoded private key
 * @param publicKey - Hex-encoded public key
 * @returns Buffer containing the shared secret
 */
export function getSharedSecret(privateKey: string, publicKey: string): Uint8Array {
  const sharedPoint = secp.getSharedSecret(privateKey, '02' + publicKey);
  // Remove the first byte (which is used to indicate compression)
  return sharedPoint.slice(1);
}

/**
 * Encrypt a message using NIP-44 (XChaCha20-Poly1305)
 * 
 * @param plaintext - Text to encrypt
 * @param privateKey - Sender's private key (hex)
 * @param publicKey - Recipient's public key (hex)
 * @returns Encrypted message as a base64 string
 */
export function encrypt(plaintext: string, privateKey: string, publicKey: string): string {
  const sharedSecret = getSharedSecret(privateKey, publicKey);
  
  // Generate random 24-byte nonce
  const nonce = randomBytes(24);

  // Create plaintext bytes from string
  const plaintextBytes = new TextEncoder().encode(plaintext);
  
  // Encrypt the message using XChaCha20-Poly1305
  const cipher = xchacha20(sharedSecret, nonce);
  const ciphertext = cipher.seal(plaintextBytes);
  
  // Construct the payload: version byte (1) + nonce (24) + ciphertext (var)
  const payload = new Uint8Array(1 + nonce.length + ciphertext.length);
  payload[0] = VERSION_BYTE; // Set version byte
  payload.set(nonce, 1); // Add nonce
  payload.set(ciphertext, 1 + nonce.length); // Add ciphertext
  
  // Convert to base64
  return Buffer.from(payload).toString('base64');
}

/**
 * Decrypt a message using NIP-44 (XChaCha20-Poly1305)
 * 
 * @param ciphertext - Base64-encoded encrypted message
 * @param privateKey - Recipient's private key (hex)
 * @param publicKey - Sender's public key (hex)
 * @returns Decrypted message text or null if decryption fails
 */
export function decrypt(ciphertext: string, privateKey: string, publicKey: string): string | null {
  try {
    // Convert base64 to bytes
    const payload = Buffer.from(ciphertext, 'base64');
    
    // Check version byte
    if (payload[0] !== VERSION_BYTE) {
      // Try to handle NIP-04 messages for backward compatibility
      return nip04.decrypt(privateKey, publicKey, ciphertext);
    }
    
    // Extract nonce (24 bytes after version byte)
    const nonce = payload.slice(1, 25);
    
    // Extract ciphertext (remaining bytes)
    const encryptedData = payload.slice(25);
    
    // Get shared secret
    const sharedSecret = getSharedSecret(privateKey, publicKey);
    
    // Decrypt
    const cipher = xchacha20(sharedSecret, nonce);
    const plaintext = cipher.open(encryptedData);
    
    // Convert bytes to string
    return new TextDecoder().decode(plaintext);
  } catch (error) {
    console.error('Error decrypting NIP-44 message:', error);
    return null;
  }
}

/**
 * Check if a string is likely a NIP-44 encrypted message
 * 
 * @param content - Message content to check
 * @returns Boolean indicating if the content appears to be a NIP-44 message
 */
export function isNip44Message(content: string): boolean {
  try {
    // Try to decode base64
    const payload = Buffer.from(content, 'base64');
    
    // NIP-44 messages start with a version byte of 0x02
    // and must be at least 25 bytes (version + nonce)
    return payload.length >= 25 && payload[0] === VERSION_BYTE;
  } catch (error) {
    // If we can't decode as base64, it's not a NIP-44 message
    return false;
  }
}

/**
 * Validate the NIP-44 event content
 * 
 * @param event - Nostr event to validate
 * @returns Object with validation result and any errors
 */
export function validateNip44Event(event: any): { valid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  // Check if kind is 4 (encrypted direct message)
  if (event.kind !== 4) {
    errors.push("Event kind must be 4 for NIP-44 encrypted messages");
  }
  
  // Check for 'p' tag (recipient)
  const pTags = event.tags.filter((tag: string[]) => tag[0] === 'p');
  if (pTags.length !== 1) {
    errors.push("NIP-44 event must contain exactly one 'p' tag for the recipient");
  }
  
  // Try to validate the content as a NIP-44 message
  if (!isNip44Message(event.content)) {
    errors.push("Content does not appear to be a valid NIP-44 encrypted message");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
