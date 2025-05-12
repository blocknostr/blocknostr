
/**
 * Implementation of NIP-05 (Mapping Nostr keys to DNS-based internet identifiers)
 * @see https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Verify if a NIP-05 identifier resolves to the expected pubkey
 * @param identifier NIP-05 identifier (e.g. "username@example.com")
 * @param pubkey Expected pubkey in hex format
 * @returns Promise<boolean> True if verification is successful
 */
export async function verifyNip05(identifier: string, pubkey: string): Promise<boolean> {
  if (!identifier || !identifier.includes("@")) {
    return false;
  }
  
  try {
    const [name, domain] = identifier.split("@");
    
    if (!name || !domain) {
      return false;
    }
    
    // Fetch the .well-known/nostr.json file from the domain
    const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if the name exists and maps to the expected pubkey
    return data?.names?.[name] === pubkey;
  } catch (error) {
    console.error("NIP-05 verification failed:", error);
    return false;
  }
}

/**
 * Fetch additional data associated with a NIP-05 identifier
 * @param identifier NIP-05 identifier in the format username@domain
 */
export async function fetchNip05Data(identifier: string): Promise<{
  pubkey?: string;
  relays?: Record<string, { read: boolean; write: boolean }>;
  [key: string]: any;
} | null> {
  if (!identifier || !identifier.includes("@")) {
    return null;
  }
  
  try {
    const [name, domain] = identifier.split("@");
    
    if (!name || !domain) {
      return null;
    }
    
    // Fetch the .well-known/nostr.json file
    const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extract the public key and associated relays
    const result: {
      pubkey?: string;
      relays?: Record<string, { read: boolean; write: boolean }>;
    } = {};
    
    if (data.names && data.names[name]) {
      result.pubkey = data.names[name];
    }
    
    // Get relay information if available
    if (data.relays && data.relays[result.pubkey!]) {
      result.relays = {};
      
      data.relays[result.pubkey!].forEach((relay: string) => {
        result.relays![relay] = { read: true, write: true };
      });
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching NIP-05 data:", error);
    return null;
  }
}
