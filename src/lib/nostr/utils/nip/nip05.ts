
/**
 * Verifies a NIP-05 identifier and returns the associated pubkey if valid
 * @param identifier - NIP-05 identifier in format username@domain.tld
 * @returns The pubkey hex if valid, null otherwise
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
  if (!identifier || !identifier.includes('@')) {
    return null;
  }

  try {
    // Normalize identifier to lowercase
    identifier = identifier.trim().toLowerCase();
    
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch(url, { 
        signal: controller.signal,
        redirect: 'error' // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object' || !data.names || typeof data.names !== 'object') {
        return null;
      }
      
      // Get pubkey from names
      const pubkey = data.names[name];
      if (!pubkey) {
        return null;
      }
      
      return pubkey;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return null;
  }
}

/**
 * Formats a NIP-05 identifier (trims and lowercases)
 * @param identifier - The NIP-05 identifier to format
 * @returns Formatted identifier
 */
export function formatNip05(identifier: string): string {
  if (!identifier) return '';
  return identifier.trim().toLowerCase();
}

/**
 * Validates if a string is in valid NIP-05 format (username@domain.tld)
 * @param identifier - String to check
 * @returns True if valid format, false otherwise
 */
export function isValidNip05Format(identifier: string): boolean {
  if (!identifier) return false;
  // Simple regex to check for username@domain.tld format
  const nip05Regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return nip05Regex.test(identifier);
}
