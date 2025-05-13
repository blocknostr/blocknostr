
/**
 * Utilities for NIP-05 (Mapping Nostr keys to DNS-based internet identifiers)
 * Ref: https://github.com/nostr-protocol/nips/blob/master/05.md
 */

/**
 * Represents a NIP-05 identifier in the format user@domain.com
 */
export interface NIP05Identifier {
  username: string;
  domain: string;
  fullIdentifier: string;
}

/**
 * Response structure from a NIP-05 verification request
 */
export interface NIP05VerificationResponse {
  names: Record<string, string>;
  relays?: Record<string, string[]>;
}

/**
 * Parses a NIP-05 identifier into its components
 * @param identifier - NIP-05 identifier (e.g. "user@example.com")
 * @returns Parsed NIP-05 identifier object or null if invalid
 */
export const parseNIP05Identifier = (identifier: string): NIP05Identifier | null => {
  if (!identifier || !identifier.includes('@')) return null;
  
  const parts = identifier.split('@');
  if (parts.length !== 2) return null;
  
  const [username, domain] = parts;
  if (!username || !domain) return null;
  
  return {
    username,
    domain,
    fullIdentifier: identifier
  };
};

/**
 * Verifies a NIP-05 identifier against a pubkey
 * @param identifier - NIP-05 identifier (e.g. "user@example.com")
 * @param pubkey - Public key to verify
 * @returns Promise resolving to true if verified, false otherwise
 */
export const verifyNIP05 = async (
  identifier: string,
  pubkey: string
): Promise<boolean> => {
  try {
    const parsed = parseNIP05Identifier(identifier);
    if (!parsed) return false;
    
    const { username, domain } = parsed;
    const url = `https://${domain}/.well-known/nostr.json?name=${username}`;
    
    const response = await fetch(url);
    if (!response.ok) return false;
    
    const data = await response.json() as NIP05VerificationResponse;
    
    if (!data.names || !data.names[username]) return false;
    
    return data.names[username] === pubkey;
  } catch (error) {
    console.error('NIP-05 verification error:', error);
    return false;
  }
};

/**
 * Formats a NIP-05 identifier for display
 * @param identifier - NIP-05 identifier
 * @param showFull - Whether to show the full identifier or just the username
 * @returns Formatted identifier
 */
export const formatNIP05 = (
  identifier: string | undefined,
  showFull = false
): string => {
  if (!identifier) return '';
  
  const parsed = parseNIP05Identifier(identifier);
  if (!parsed) return identifier;
  
  return showFull ? parsed.fullIdentifier : parsed.username;
};

/**
 * Checks if a string is a valid NIP-05 identifier
 */
export const isValidNIP05 = (identifier: string): boolean => {
  return parseNIP05Identifier(identifier) !== null;
};
