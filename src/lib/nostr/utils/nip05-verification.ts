
/**
 * Utility functions for NIP-05 verification
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Validates a NIP-05 identifier format (user@domain.com)
 */
export const isValidNip05Format = (nip05Id: string): boolean => {
  if (!nip05Id) return false;
  
  // Must contain exactly one @ character with content before and after
  const parts = nip05Id.split('@');
  if (parts.length !== 2) return false;
  
  const [name, domain] = parts;
  if (!name || !domain) return false;
  
  // Domain must be a valid hostname
  try {
    // Check if domain looks like a valid hostname
    return /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
  } catch (e) {
    return false;
  }
};

/**
 * Fetches NIP-05 verification data
 * Returns null if verification fails
 */
export const fetchNip05Data = async (
  nip05Id: string
): Promise<{ pubkey: string; relays?: string[] } | null> => {
  if (!isValidNip05Format(nip05Id)) {
    return null;
  }
  
  try {
    const [name, domain] = nip05Id.split('@');
    const wellKnownUrl = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    const response = await fetch(wellKnownUrl);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (!data?.names?.[name]) {
      return null;
    }
    
    const pubkey = data.names[name];
    const relays = data.relays?.[pubkey];
    
    return {
      pubkey,
      relays
    };
  } catch (error) {
    console.error('Error fetching NIP-05 data:', error);
    return null;
  }
};

/**
 * Verify that a pubkey matches a NIP-05 identifier
 */
export const verifyNip05 = async (
  nip05Id: string,
  pubkey: string
): Promise<boolean> => {
  const result = await fetchNip05Data(nip05Id);
  return result?.pubkey === pubkey;
};
