
import { nostrService } from "./nostr";

/**
 * Utility functions for note encryption using NIP-04
 */
export const encryption = {
  /**
   * Encrypt content using the user's own pubkey (self-encryption)
   */
  async encryptContent(content: string): Promise<string | null> {
    try {
      const publicKey = nostrService.publicKey;
      
      if (!publicKey) {
        throw new Error("User must be logged in to encrypt content");
      }
      
      // Use the NIP-04 method from the Nostr extension
      if (window.nostr?.nip04) {
        // Self-encrypt: use our own pubkey as the recipient
        const encrypted = await window.nostr.nip04.encrypt(publicKey, content);
        return encrypted;
      } else {
        throw new Error("NIP-04 encryption not available");
      }
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  },
  
  /**
   * Decrypt content using the user's private key
   */
  async decryptContent(encryptedContent: string, senderPubkey: string): Promise<string | null> {
    try {
      // Use the NIP-04 method from the Nostr extension
      if (window.nostr?.nip04) {
        const decrypted = await window.nostr.nip04.decrypt(senderPubkey, encryptedContent);
        return decrypted;
      } else {
        throw new Error("NIP-04 decryption not available");
      }
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  },
  
  /**
   * Password-based encryption for local notes (when no Nostr extension is available)
   * Uses Web Crypto API
   */
  async encryptWithPassword(content: string, password: string): Promise<{encrypted: string, salt: string} | null> {
    try {
      // Generate a random salt
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Derive a key from the password
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      
      // Encrypt the content
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv
        },
        key,
        new TextEncoder().encode(content)
      );
      
      // Convert to base64 for storage
      const encryptedArray = new Uint8Array(encryptedBuffer);
      const saltString = Array.from(salt)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      const ivString = Array.from(iv)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      // Store together as base64
      const encryptedString = btoa(
        ivString + ":" + 
        Array.from(encryptedArray)
          .map(b => String.fromCharCode(b))
          .join("")
      );
      
      return {
        encrypted: encryptedString,
        salt: saltString
      };
    } catch (error) {
      console.error("Password encryption error:", error);
      return null;
    }
  },
  
  /**
   * Decrypt content using a password
   */
  async decryptWithPassword(encryptedData: string, salt: string, password: string): Promise<string | null> {
    try {
      // Convert salt from hex string
      const saltArray = new Uint8Array(
        salt.match(/.{1,2}/g)!.map(hex => parseInt(hex, 16))
      );
      
      // Decode the encrypted data
      const decoded = atob(encryptedData);
      const ivString = decoded.slice(0, 24);
      const encryptedContent = decoded.slice(25);
      
      // Convert IV from hex string
      const iv = new Uint8Array(
        ivString.match(/.{1,2}/g)!.map(hex => parseInt(hex, 16))
      );
      
      // Derive the key from the password
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: saltArray,
          iterations: 100000,
          hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      
      // Decode encrypted content
      const encryptedArray = new Uint8Array(encryptedContent.length);
      for (let i = 0; i < encryptedContent.length; i++) {
        encryptedArray[i] = encryptedContent.charCodeAt(i);
      }
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv
        },
        key,
        encryptedArray
      );
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error("Password decryption error:", error);
      return null;
    }
  },
  
  /**
   * Generate a secure encryption key for local storage
   * This function does not attempt to save the key to localStorage
   */
  generateEncryptionKey(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  },
  
  /**
   * Try to safely store an encryption key, with fallback for quota errors
   */
  safelyStoreEncryptionKey(key: string): boolean {
    try {
      localStorage.setItem('notebin_encryption_key', key);
      return true;
    } catch (error) {
      console.warn("Failed to store encryption key:", error);
      return false;
    }
  },
  
  /**
   * Check if content is encrypted (simple heuristic)
   */
  isEncryptedContent(content: string): boolean {
    // Encrypted content is typically base64-like and doesn't contain
    // much whitespace or typical plaintext patterns
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    
    // If content is short, we can't easily tell
    if (content.length < 20) {
      return false;
    }
    
    // Check if it's base64-like and doesn't contain normal text patterns
    const isLikelyEncrypted = 
      base64Regex.test(content) ||
      !content.includes(" ") || 
      content.includes("?iv=");
      
    return isLikelyEncrypted;
  }
};
