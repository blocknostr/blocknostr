/**
 * NIP-05: DNS-based identifier verification and discovery
 * Implements https://github.com/nostr-protocol/nips/blob/master/05.md
 */
import { nip19 } from 'nostr-tools';

/**
 * Tests if a string conforms to the NIP-05 identifier format (local-part@domain.tld)
 * As per NIP-05, local-part should be restricted to a-z0-9-_. (case-insensitive)
 */
export function isValidNip05Format(nip05: string): boolean {
  if (!nip05) return false;
  
  // NIP-05 format is local-part@domain.tld
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
 * Verify a NIP-05 identifier and resolve to a pubkey
 * 
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns The pubkey in hex format if verified, or null if verification fails
 */
export async function verifyNip05(identifier: string): Promise<string | null> {
  if (!isValidNip05Format(identifier)) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    
    // Make a GET request to the well-known URL
    // As per NIP-05: https://<domain>/.well-known/nostr.json?name=<local-part>
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Per NIP-05: "Fetchers MUST ignore any HTTP redirects"
    const response = await fetch(url, { 
      redirect: 'error',
      headers: {
        'Accept': 'application/json'
      }
    });
    
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
  relays?: Record<string, { read: boolean; write: boolean }>;
  nip05_domain?: string;
  nip05_name?: string;
  [key: string]: any;
} | null> {
  if (!isValidNip05Format(identifier)) {
    console.error("Invalid NIP-05 identifier format");
    return null;
  }

  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    const response = await fetch(url, { 
      redirect: 'error',
      headers: {
        'Accept': 'application/json'
      }
    });
    
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
    
    // Process relays data according to the NIP-05 spec
    let relays: Record<string, { read: boolean; write: boolean }> = {};
    
    if (data.relays && typeof data.relays === 'object' && data.relays[pubkey]) {
      // Per NIP-05: relays should be a map of pubkeys to arrays of relay URLs
      if (Array.isArray(data.relays[pubkey])) {
        const relayUrls = data.relays[pubkey];
        
        // Transform array format to object with read/write props
        relays[pubkey] = {
          read: true,
          write: true
        };
      }
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

/**
 * Check if a NIP-05 identifier resolves to the expected pubkey
 * 
 * @param identifier - NIP-05 identifier
 * @param expectedPubkey - The pubkey that should match (optional)
 * @returns True if verification is successful and matches expectedPubkey if provided
 */
export async function verifyNip05ForPubkey(identifier: string, expectedPubkey?: string): Promise<boolean> {
  const pubkey = await verifyNip05(identifier);
  
  if (!pubkey) return false;
  
  // If expectedPubkey is provided, check that it matches the resolved pubkey
  if (expectedPubkey) {
    return pubkey === expectedPubkey;
  }
  
  // Otherwise, just return true if we got a valid pubkey
  return true;
}

/**
 * Format a NIP-05 identifier with proper styling and validation
 * 
 * @param identifier - NIP-05 identifier
 * @returns Object containing the formatted parts and validation status
 */
export function formatNip05(identifier: string): {
  localPart: string;
  domain: string;
  isValid: boolean;
  display: string;
} {
  const isValid = isValidNip05Format(identifier);
  let localPart = '';
  let domain = '';
  
  if (identifier && identifier.includes('@')) {
    [localPart, domain] = identifier.split('@');
  }
  
  return {
    localPart,
    domain,
    isValid,
    display: isValid ? identifier : ''
  };
}
