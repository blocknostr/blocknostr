
/**
 * NIP-05 Implementation
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 * 
 * This module handles validation, verification, and relay discovery for NIP-05 identifiers.
 */
import { nip19 } from 'nostr-tools';

/**
 * Regex to validate NIP-05 format (user@domain.tld)
 * Supports underscore (_) as the wildcard character per spec
 */
const NIP05_REGEX = /^([a-zA-Z0-9_.-]+)@([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+)$/;

// Default timeout for fetch requests (5 seconds)
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Validates if a string matches the NIP-05 format
 * @param nip05Id - The identifier to validate
 */
export function isValidNip05Format(nip05Id: string): boolean {
  if (!nip05Id) return false;
  return NIP05_REGEX.test(nip05Id);
}

/**
 * Parses a NIP-05 identifier into its components
 * @param nip05Id - The identifier to parse
 * @returns Object containing name and domain, or null if invalid
 */
export function parseNip05Id(nip05Id: string): { name: string; domain: string } | null {
  if (!isValidNip05Format(nip05Id)) return null;
  
  const [name, domain] = nip05Id.split('@');
  return { name, domain };
}

/**
 * Creates a timeout promise for fetch requests
 * @param ms - Timeout in milliseconds
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`NIP-05 request timed out after ${ms}ms`)), ms);
  });
}

/**
 * Fetch with timeout
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param timeoutMs - Timeout in milliseconds
 */
async function fetchWithTimeout(
  url: string, 
  options: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    createTimeout(timeoutMs)
  ]);
}

/**
 * Fetch NIP-05 data from a domain
 * @param nip05Id - NIP-05 identifier (user@domain.tld)
 * @param options - Advanced options (timeout, headers)
 * @returns NIP-05 data including pubkey and relays, or null if invalid/not found
 */
export async function fetchNip05Data(
  nip05Id: string,
  options: { timeoutMs?: number; headers?: HeadersInit } = {}
): Promise<{
  pubkey: string;
  relays?: Record<string, { read: boolean; write: boolean }>;
  nip05_domain: string;
  nip05_name: string;
} | null> {
  // Validate and parse the NIP-05 ID
  const parsed = parseNip05Id(nip05Id);
  if (!parsed) {
    console.error(`Invalid NIP-05 identifier format: ${nip05Id}`);
    return null;
  }
  
  const { name, domain } = parsed;
  
  try {
    // Construct the URL according to NIP-05 spec
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;
    
    // Fetch with timeout
    const response = await fetchWithTimeout(
      url, 
      { 
        headers: options.headers || {
          Accept: 'application/json',
        }
      },
      options.timeoutMs || DEFAULT_TIMEOUT_MS
    );
    
    // Handle HTTP errors
    if (!response.ok) {
      console.error(`NIP-05 HTTP error: ${response.status} for ${url}`);
      return null;
    }
    
    // Parse JSON response
    const data = await response.json();
    
    // Validate if response has names field
    if (!data.names || typeof data.names !== 'object') {
      console.error(`Invalid NIP-05 JSON response: missing names field for ${url}`);
      return null;
    }
    
    // Check if the name exists in the response
    const pubkey = data.names[name];
    if (!pubkey) {
      console.error(`NIP-05 name not found: ${name} at ${domain}`);
      return null;
    }
    
    // Return the result with optional relays if available
    return {
      pubkey,
      relays: data.relays && data.relays[pubkey] ? data.relays[pubkey] : undefined,
      nip05_domain: domain,
      nip05_name: name
    };
  } catch (error) {
    console.error(`NIP-05 fetch error for ${nip05Id}:`, error);
    return null;
  }
}

/**
 * Verify if a NIP-05 identifier resolves to the expected pubkey
 * @param nip05Id - NIP-05 identifier (user@domain.tld)
 * @param expectedPubkey - Expected pubkey to verify
 * @returns True if the NIP-05 identifier resolves to the expected pubkey
 */
export async function verifyNip05(nip05Id: string, expectedPubkey: string): Promise<boolean> {
  try {
    // Convert npub to hex if needed
    let hexPubkey = expectedPubkey;
    if (expectedPubkey.startsWith('npub')) {
      try {
        // Decode using nip19
        const decoded = nip19.decode(expectedPubkey);
        if (decoded.type === 'npub') {
          hexPubkey = decoded.data as string;
        } else {
          return false;
        }
      } catch (e) {
        console.error('Invalid npub format:', e);
        return false;
      }
    }
    
    // Fetch NIP-05 data
    const nip05Data = await fetchNip05Data(nip05Id);
    
    // Check if data exists and matches expected pubkey
    return !!nip05Data && nip05Data.pubkey === hexPubkey;
  } catch (error) {
    console.error(`Error in verifyNip05:`, error);
    return false;
  }
}

/**
 * Get pubkey from a NIP-05 identifier
 * @param nip05Id - NIP-05 identifier (user@domain.tld)
 * @returns Pubkey if found, null otherwise
 */
export async function getNip05Pubkey(nip05Id: string): Promise<string | null> {
  try {
    const nip05Data = await fetchNip05Data(nip05Id);
    return nip05Data ? nip05Data.pubkey : null;
  } catch (error) {
    console.error(`Error in getNip05Pubkey:`, error);
    return null;
  }
}

/**
 * Discover relays for a pubkey using NIP-05
 * @param nip05Id - NIP-05 identifier (user@domain.tld)
 * @returns Array of relay URLs or empty array if none found
 */
export async function discoverNip05Relays(nip05Id: string): Promise<string[]> {
  try {
    const nip05Data = await fetchNip05Data(nip05Id);
    
    if (!nip05Data || !nip05Data.relays) {
      return [];
    }
    
    // Extract relay URLs
    return Object.entries(nip05Data.relays)
      // Filter relays that have read permissions
      .filter(([_, permissions]) => permissions.read)
      // Return only the URLs
      .map(([url, _]) => url);
  } catch (error) {
    console.error(`Error in discoverNip05Relays:`, error);
    return [];
  }
}
