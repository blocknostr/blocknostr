
/**
 * Enhanced NIP-05 verification function that validates JSON structure and resolves identifiers to pubkeys
 * Implementation follows https://github.com/nostr-protocol/nips/blob/master/05.md
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns The pubkey in hex format if verified, or null if verification fails
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
  // Import the implementation from utils to avoid duplication
  const { verifyNip05 } = await import('@/lib/nostr/utils/nip/nip05');
  return verifyNip05(identifier);
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
  // Both formats of relay data are preserved
  relays?: Record<string, { read: boolean; write: boolean }>;
  rawRelays?: Record<string, string[]>; // Original format from the NIP-05 JSON
  nip05_domain?: string;
  nip05_name?: string;
  [key: string]: any;
} | null> {
  // Import for validation
  const { isValidHexString } = await import('@/lib/nostr/utils/keys');
  const { retry } = await import('@/lib/utils/retry');
  
  if (!identifier || !identifier.includes('@')) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  // Normalize identifier to lowercase
  identifier = identifier.trim().toLowerCase();

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name.toLowerCase())}`;
    
    // Use retry with timeout for better reliability
    const fetchWithTimeout = async () => {
      // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(url, { 
          redirect: 'error',
          signal: controller.signal 
        });
        
        // Check if the request was successful
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    // Use retry utility for resilience
    const response = await retry(fetchWithTimeout, {
      maxAttempts: 2,
      baseDelay: 1000,
      onRetry: (attempt) => console.log(`Retrying NIP-05 data fetch (${attempt})`)
    });
    
    const data = await response.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object' || !data.names || typeof data.names !== 'object') {
      console.error("NIP-05 data fetch failed: Invalid response structure");
      return null;
    }
    
    // Get pubkey from names
    const pubkey = data.names[name.toLowerCase()];
    if (!pubkey) {
      console.error(`NIP-05 data fetch failed: Username '${name}' not found in names object`);
      return null;
    }
    
    // Validate pubkey format
    if (!isValidHexString(pubkey)) {
      console.error("NIP-05 data fetch failed: Invalid pubkey format");
      return null;
    }
    
    // Store both the original relay format and the transformed format
    let relays: Record<string, { read: boolean; write: boolean }> | undefined;
    let rawRelays: Record<string, string[]> | undefined;
    
    // Check for the recommended 'relays' object which maps pubkeys to arrays of relay URLs
    if (data.relays && typeof data.relays === 'object' && data.relays[pubkey]) {
      // Store the original format
      rawRelays = {
        [pubkey]: data.relays[pubkey]
      };
      
      // Transform to expected format
      relays = {
        [pubkey]: {
          read: true,
          write: true
        }
      };
    }
    
    return { 
      pubkey,
      relays,
      rawRelays, // Preserve the original format
      nip05_domain: domain,
      nip05_name: name
    };
  } catch (error) {
    console.error("Error fetching NIP-05 data:", error);
    return null;
  }
}
