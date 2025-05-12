
/**
 * Enhanced NIP-05 verification function that validates JSON structure and matches pubkeys
 * Implementation follows https://github.com/nostr-protocol/nips/blob/master/05.md
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
  if (!identifier || !identifier.includes('@')) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`NIP-05 verification failed: HTTP ${response.status} for ${url}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate structure according to NIP-05 spec
    if (!data || typeof data !== 'object') {
      console.error("NIP-05 verification failed: Invalid response format");
      return null;
    }
    
    if (!data.names || typeof data.names !== 'object') {
      console.error("NIP-05 verification failed: Missing or invalid 'names' field");
      return null;
    }
    
    // Check if name exists in the names object and get the associated pubkey
    if (!Object.prototype.hasOwnProperty.call(data.names, name)) {
      console.error(`NIP-05 verification failed: Username '${name}' not found in names object`);
      return null;
    }
    
    return data.names[name] || null;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return null;
  }
}

/**
 * Enhanced NIP-05 data fetcher that returns additional information beyond just verification
 */
export async function fetchNip05Data(identifier: string): Promise<{
  pubkey?: string;
  relays?: Record<string, { read: boolean; write: boolean }>;
  [key: string]: any;
} | null> {
  if (!identifier || !identifier.includes('@')) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
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
    
    // Get relay information if available
    const relays = data.relays?.[pubkey] || {};
    
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
