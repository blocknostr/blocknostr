
/**
 * NIP-05: Utility functions for DNS identifier verification
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Tests if a string conforms to the NIP-05 identifier format (local-part@domain.tld)
 * As per NIP-05, local-part should be restricted to a-z0-9-_. (case-insensitive)
 */
export function isValidNip05Format(nip05: string): boolean {
  if (!nip05) return false;
  
  // NIP-05 format is local-part@domain.tld
  // The spec recommends restricting local-part to a-z0-9-_. (case-insensitive)
  const parts = nip05.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Check if localPart is empty or domain is invalid
  if (!localPart || !domain || !domain.includes('.')) return false;
  
  // Check if localPart follows recommended character restrictions (a-z0-9-_.)
  const localPartRegex = /^[a-z0-9\-_.]+$/i;
  if (!localPartRegex.test(localPart)) return false;
  
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  return domainRegex.test(domain);
}

/**
 * Verify a NIP-05 identifier and check if it resolves to the expected pubkey
 * Enhanced to validate JSON structure and names field, per NIP-05 spec
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @param expectedPubkey - The pubkey that should match the NIP-05 identifier
 * @returns True if the NIP-05 identifier resolves to the expected pubkey
 */
export async function verifyNip05(identifier: string, expectedPubkey?: string): Promise<boolean> {
  if (!identifier || !identifier.includes('@')) {
    console.log("Invalid NIP-05 identifier format");
    return false;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
    const response = await fetch(url, { redirect: 'error' });
    
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
    
    // Get the pubkey and verify it matches if expectedPubkey was provided
    const resolvedPubkey = data.names[name];
    
    if (expectedPubkey) {
      // Only verify against expected pubkey if one was provided
      return resolvedPubkey === expectedPubkey;
    }
    
    // If no expected pubkey provided, just check that we got a valid pubkey back
    return !!resolvedPubkey;
  } catch (error) {
    console.error("NIP-05 verification error:", error);
    return false;
  }
}
