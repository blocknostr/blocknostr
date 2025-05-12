
/**
 * Enhanced NIP-05 verification function that validates JSON structure and resolves identifiers to pubkeys
 * Implementation follows https://github.com/nostr-protocol/nips/blob/master/05.md
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns The pubkey in hex format if verified, or null if verification fails
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
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
    
    // Return the pubkey in hex format
    return data.names[name] || null;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return null;
  }
}

/**
 * Enhanced NIP-05 data fetcher that returns additional information beyond just verification
 * Including the recommended 'relays' information as specified in NIP-05
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns Object containing pubkey, relays, and metadata if successful, null otherwise
 */
export async function fetchNip05Data(identifier: string): Promise<{
  pubkey?: string;
  relays?: Record<string, string[]>;  // Updated to match NIP-05 spec: array of relay URLs
  nip05_domain?: string;
  nip05_name?: string;
  [key: string]: any;
} | null> {
  if (!identifier || !identifier.includes('@')) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
    const response = await fetch(url, { redirect: 'error' });
    
    if (!response.ok) {
      console.error(`NIP-05 data fetch failed: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object' || !data.names || typeof data.names !== 'object') {
      console.error("NIP-05 data fetch failed: Invalid response structure");
      return null;
    }
    
    // Get pubkey from names
    const pubkey = data.names[name];
    if (!pubkey) {
      console.error(`NIP-05 data fetch failed: Username '${name}' not found in names object`);
      return null;
    }
    
    // Check for the recommended 'relays' object which maps pubkeys to arrays of relay URLs
    let relays: Record<string, string[]> | undefined;
    if (data.relays && typeof data.relays === 'object' && data.relays[pubkey]) {
      relays = {
        [pubkey]: data.relays[pubkey]
      };
    }
    
    return { 
      pubkey,
      relays,
      nip05_domain: domain,
      nip05_name: name
    };
  } catch (error) {
    console.error("Error fetching NIP-05 data:", error);
    return null;
  }
}
