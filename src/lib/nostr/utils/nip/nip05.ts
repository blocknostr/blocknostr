
/**
 * NIP-05: DNS-Based Verification & Discovery
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 *
 * This module provides a complete implementation of NIP-05 for:
 * - Validating NIP-05 identifier format
 * - Verifying identifiers against public keys
 * - Fetching NIP-05 metadata including relays
 */

import { nip19 } from 'nostr-tools';

// Type for NIP-05 response data according to spec
export interface Nip05Response {
  names: Record<string, string>;
  relays?: Record<string, Record<string, { read: boolean; write: boolean }>>;
  nip05_domain?: string;
  nip05_name?: string;
}

// Type for the return value of fetchNip05Data
export interface Nip05Data {
  pubkey: string;
  relays?: Record<string, { read: boolean; write: boolean }>;
  nip05_domain?: string;
  nip05_name?: string;
}

/**
 * Validates a NIP-05 identifier format
 * Follows specification for Internet Identifier format (user@domain.tld)
 * Supports '_' as a wildcard character for the username part
 */
export const isValidNip05Format = (nip05Id: string): boolean => {
  if (!nip05Id) return false;
  
  // NIP-05 format is user@domain.tld
  // Username part can contain letters, numbers, underscore, dot, and dash
  // Domain part must be a valid hostname
  const regex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  return regex.test(nip05Id);
};

/**
 * Fetches NIP-05 verification data from a well-known URL
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns NIP-05 data including pubkey and optional relays, or null if verification fails
 */
export const fetchNip05Data = async (
  identifier: string
): Promise<Nip05Data | null> => {
  if (!isValidNip05Format(identifier)) {
    console.warn(`Invalid NIP-05 format: ${identifier}`);
    return null;
  }
  
  try {
    const [name, domain] = identifier.split('@');
    
    // Construct the .well-known URL according to NIP-05 spec
    const wellKnownUrl = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Set timeout for fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);  // 10 second timeout
    
    const response = await fetch(wellKnownUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`NIP-05 verification failed: HTTP ${response.status} for ${wellKnownUrl}`);
      return null;
    }
    
    const data = await response.json();
    
    // Validate response structure according to NIP-05 spec
    if (!data || typeof data !== 'object') {
      console.warn(`Invalid NIP-05 response format from ${wellKnownUrl}`);
      return null;
    }
    
    if (!data.names || typeof data.names !== 'object') {
      console.warn(`Missing or invalid 'names' field in NIP-05 response from ${wellKnownUrl}`);
      return null;
    }
    
    // Check if the name exists in the names object
    if (!Object.prototype.hasOwnProperty.call(data.names, name)) {
      console.warn(`Username '${name}' not found in NIP-05 response from ${wellKnownUrl}`);
      return null;
    }
    
    // Get the pubkey
    const pubkey = data.names[name];
    
    // Get relay information if available
    const relays = pubkey && data.relays ? data.relays[pubkey] : undefined;
    
    return {
      pubkey,
      relays,
      nip05_domain: domain,
      nip05_name: name
    };
  } catch (error) {
    console.error(`Error fetching NIP-05 data for ${identifier}:`, error);
    return null;
  }
};

/**
 * Verifies that a pubkey matches a NIP-05 identifier
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @param expectedPubkey - The pubkey to verify against the NIP-05 identifier
 * @returns True if the NIP-05 identifier resolves to the expected pubkey
 */
export const verifyNip05 = async (
  identifier: string,
  expectedPubkey: string
): Promise<boolean> => {
  if (!identifier || !expectedPubkey) {
    console.warn("Missing NIP-05 identifier or pubkey for verification");
    return false;
  }
  
  try {
    const nip05Data = await fetchNip05Data(identifier);
    
    if (!nip05Data) {
      return false;
    }
    
    // Normalize hex pubkeys for comparison
    const normalizeHexPubkey = (pubkey: string): string => {
      // Handle npub format
      if (pubkey.startsWith('npub1')) {
        try {
          const { data } = nip19.decode(pubkey);
          return data as string;
        } catch (e) {
          console.error('Error decoding npub:', e);
          return pubkey;
        }
      }
      return pubkey;
    };
    
    const normalizedExpected = normalizeHexPubkey(expectedPubkey);
    const normalizedActual = normalizeHexPubkey(nip05Data.pubkey);
    
    return normalizedExpected === normalizedActual;
  } catch (error) {
    console.error(`Error verifying NIP-05 identifier ${identifier}:`, error);
    return false;
  }
};

/**
 * Gets the pubkey associated with a NIP-05 identifier
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns The pubkey if found, null otherwise
 */
export const getNip05Pubkey = async (identifier: string): Promise<string | null> => {
  if (!identifier) {
    console.warn("Missing NIP-05 identifier");
    return null;
  }
  
  try {
    const nip05Data = await fetchNip05Data(identifier);
    return nip05Data?.pubkey || null;
  } catch (error) {
    console.error(`Error getting pubkey for NIP-05 identifier ${identifier}:`, error);
    return null;
  }
};

/**
 * Discovers relays for a NIP-05 identifier
 * @param identifier - NIP-05 identifier in the format username@domain.tld
 * @returns An array of relay URLs if found, empty array otherwise
 */
export const discoverNip05Relays = async (identifier: string): Promise<string[]> => {
  if (!identifier) {
    console.warn("Missing NIP-05 identifier for relay discovery");
    return [];
  }
  
  try {
    const nip05Data = await fetchNip05Data(identifier);
    
    if (!nip05Data?.relays) {
      return [];
    }
    
    // Extract relay URLs
    return Object.keys(nip05Data.relays);
  } catch (error) {
    console.error(`Error discovering relays for NIP-05 identifier ${identifier}:`, error);
    return [];
  }
};
