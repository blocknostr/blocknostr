
/**
 * Common encryption utility functions
 */
export const encryptionUtils = {
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
