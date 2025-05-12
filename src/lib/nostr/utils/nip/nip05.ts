
/**
 * Enhanced NIP-05 verification function that validates JSON structure and resolves identifiers to pubkeys
 * Implementation follows https://github.com/nostr-protocol/nips/blob/master/05.md
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @param pubkeyHex - Optional hexadecimal public key to verify against
 * @returns True if verified (pubkey matches if provided), false if verification fails
 */
export async function verifyNip05(identifier: string, pubkeyHex?: string): Promise<string | null> {
  // Check if the identifier is valid (contains @)
  if (!identifier || !identifier.includes('@')) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    // Split the identifier into local-part and domain
    const [name, domain] = identifier.split('@');
    
    // Format should be local-part@domain, as per NIP-05
    if (!name || !domain) {
      console.error("NIP-05 identifier must contain both name and domain parts");
      return null;
    }
    
    // Make a GET request to the well-known URL
    // As per NIP-05: https://<domain>/.well-known/nostr.json?name=<local-part>
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
    const response = await fetch(url, { redirect: 'error' });
    
    // Check if the request was successful
    if (!response.ok) {
      console.error(`NIP-05 verification failed: HTTP ${response.status} for ${url}`);
      return null;
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Validate the response structure as per NIP-05 spec
    if (!data || typeof data !== 'object') {
      console.error("NIP-05 verification failed: Invalid response format");
      return null;
    }
    
    // Check if the response has a names object
    if (!data.names || typeof data.names !== 'object') {
      console.error("NIP-05 verification failed: Missing or invalid 'names' field");
      return null;
    }
    
    // Check if the name exists in the names object and get its pubkey
    if (!Object.prototype.hasOwnProperty.call(data.names, name)) {
      console.error(`NIP-05 verification failed: Username '${name}' not found in names object`);
      return null;
    }
    
    // Get the pubkey from the response
    const responsePubkey = data.names[name];
    
    // If a pubkey was provided, verify it matches
    if (pubkeyHex) {
      return responsePubkey === pubkeyHex ? responsePubkey : null;
    }
    
    // If no pubkey was provided, just return the pubkey
    return responsePubkey;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return null;
  }
}

/**
 * Verifies that a NIP-05 identifier resolves to a specific public key
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @param pubkeyHex - Hexadecimal public key to verify
 * @returns True if the identifier resolves to the specified pubkey, false otherwise
 */
export async function verifyNip05ForPubkey(identifier: string, pubkeyHex: string): Promise<boolean> {
  const result = await verifyNip05(identifier, pubkeyHex);
  return result === pubkeyHex;
}

/**
 * Checks if a string is in valid NIP-05 format (username@domain.tld)
 * 
 * @param identifier - String to check
 * @returns True if the string is a valid NIP-05 identifier
 */
export function isValidNip05Format(identifier: string): boolean {
  if (!identifier) return false;
  
  // Simple regex to check for username@domain.tld format
  const nip05Regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return nip05Regex.test(identifier);
}

/**
 * Formats a NIP-05 identifier to ensure it's in the correct format
 * Removes any extraneous whitespace and ensures lowercase
 * 
 * @param identifier - NIP-05 identifier to format
 * @returns Formatted NIP-05 identifier
 */
export function formatNip05(identifier: string): string {
  if (!identifier) return '';
  return identifier.trim().toLowerCase();
}
