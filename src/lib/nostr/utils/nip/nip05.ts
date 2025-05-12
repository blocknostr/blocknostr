
/**
 * NIP-05: Utility functions for DNS identifier verification
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Tests if a string conforms to the NIP-05 identifier format
 */
export function isValidNip05Format(nip05: string): boolean {
  if (!nip05) return false;
  
  // NIP-05 format is user@domain.tld
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(nip05);
}

/**
 * Verify a NIP-05 identifier and check if it resolves to the expected pubkey
 * Enhanced to validate JSON structure and names field
 * @param identifier - NIP-05 identifier in the format username@domain.com
 * @param expectedPubkey - The pubkey that should match the NIP-05 identifier
 * @returns True if the NIP-05 identifier resolves to the expected pubkey
 */
export async function verifyNip05(identifier: string, expectedPubkey: string): Promise<boolean> {
  if (!identifier || !identifier.includes('@') || !expectedPubkey) {
    console.log("Invalid NIP-05 identifier or missing pubkey");
    return false;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`NIP-05 verification failed: HTTP ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    // Validate structure: must have names field that is an object
    if (!data || !data.names || typeof data.names !== 'object') {
      console.error("NIP-05 verification failed: Invalid response structure (missing names field)");
      return false;
    }
    
    // Check if the name exists in the names object
    if (!Object.prototype.hasOwnProperty.call(data.names, name)) {
      console.error(`NIP-05 verification failed: Username '${name}' not found in names object`);
      return false;
    }
    
    // Get the pubkey and verify it matches
    const resolvedPubkey = data.names[name];
    
    if (resolvedPubkey === expectedPubkey) {
      return true;
    } else {
      console.error(`NIP-05 verification failed: Pubkey mismatch`);
      return false;
    }
  } catch (error) {
    console.error("NIP-05 verification error:", error);
    return false;
  }
}
