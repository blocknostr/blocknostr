
/**
 * NIP-05 implementation
 * Based on https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Fetches and validates a NIP-05 identifier
 * @param identifier - The NIP-05 identifier in the format username@domain.com
 * @returns The public key if validation succeeds, null otherwise
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
  try {
    // NIP-05 identifiers must be in the format username@domain
    if (!identifier || !identifier.includes('@')) {
      return null;
    }

    const [name, domain] = identifier.split('@');
    if (!name || !domain) {
      return null;
    }

    // According to NIP-05, we should fetch from /.well-known/nostr.json 
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Fetch the data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    
    // NIP-05 specifies that the JSON should contain a "names" object
    // with usernames as keys and pubkeys as values
    if (!data.names || !data.names[name]) {
      return null;
    }

    // Return the verified pubkey
    return data.names[name];
  } catch (error) {
    console.error('Error verifying NIP-05 identifier:', error);
    return null;
  }
}

/**
 * Fetches additional data from NIP-05 JSON
 * This includes relays and other user information
 * @param identifier - The NIP-05 identifier in the format username@domain.com
 * @returns Additional NIP-05 data or null if the fetch fails
 */
export async function fetchNip05Data(identifier: string): Promise<{
  relays?: Record<string, { read: boolean; write: boolean }>;
  [key: string]: any;
} | null> {
  try {
    // NIP-05 identifiers must be in the format username@domain
    if (!identifier || !identifier.includes('@')) {
      return null;
    }

    const [name, domain] = identifier.split('@');
    if (!name || !domain) {
      return null;
    }

    // Fetch from /.well-known/nostr.json
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Fetch the data
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response
    const data = await response.json();
    
    // If we have relays data for this user, return it
    const result: { relays?: Record<string, { read: boolean; write: boolean }> } = {};
    
    // According to NIP-05, we can also have "relays" object with pubkeys as keys
    if (data.names && data.names[name] && data.relays && data.relays[data.names[name]]) {
      result.relays = {};
      
      // Format relays data according to our internal format
      for (const relay of data.relays[data.names[name]]) {
        result.relays[relay] = { read: true, write: true };
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching NIP-05 data:', error);
    return null;
  }
}
