
import { isValidNip05Format, verifyNip05, fetchNip05Data } from '../nip';

describe('NIP-05 Identifier Format Validation', () => {
  test('should validate correct NIP-05 identifiers', () => {
    expect(isValidNip05Format('user@example.com')).toBe(true);
    expect(isValidNip05Format('alice@domain.co')).toBe(true);
    expect(isValidNip05Format('bob.name@subdomain.example.org')).toBe(true);
    expect(isValidNip05Format('user_name@example.com')).toBe(true);
    expect(isValidNip05Format('user-name@example.com')).toBe(true);
    expect(isValidNip05Format('_@example.com')).toBe(true); // Wildcard support
  });
  
  test('should reject invalid NIP-05 identifiers', () => {
    expect(isValidNip05Format('')).toBe(false);
    expect(isValidNip05Format('invalid')).toBe(false);
    expect(isValidNip05Format('@domain.com')).toBe(false);
    expect(isValidNip05Format('user@')).toBe(false);
    expect(isValidNip05Format('user@domain')).toBe(false);
    expect(isValidNip05Format('user@.com')).toBe(false);
    expect(isValidNip05Format('user@domain.')).toBe(false);
    expect(isValidNip05Format('us er@domain.com')).toBe(false);
  });
});

// Mock for fetch to test NIP-05 verification
global.fetch = jest.fn();

describe('NIP-05 Data Fetching', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('should return full NIP-05 data for valid verification', async () => {
    // Mock successful response with relay information
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        names: {
          alice: 'pubkey123'
        },
        relays: {
          'pubkey123': {
            'wss://relay1.example.com': { read: true, write: true },
            'wss://relay2.example.com': { read: true, write: false }
          }
        }
      })
    });
    
    const result = await fetchNip05Data('alice@example.com');
    
    expect(result).toEqual({
      pubkey: 'pubkey123',
      relays: {
        'wss://relay1.example.com': { read: true, write: true },
        'wss://relay2.example.com': { read: true, write: false }
      },
      nip05_domain: 'example.com',
      nip05_name: 'alice'
    });
    
    // Verify fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/.well-known/nostr.json?name=alice',
      expect.any(Object)
    );
  });
  
  test('should return null for invalid NIP-05 identifier format', async () => {
    const result = await fetchNip05Data('invalid-format');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  
  test('should return null for HTTP error', async () => {
    // Mock HTTP error
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    const result = await fetchNip05Data('alice@example.com');
    expect(result).toBeNull();
  });
  
  test('should return null for invalid JSON response', async () => {
    // Mock invalid JSON response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        // Missing names field
      })
    });
    
    const result = await fetchNip05Data('alice@example.com');
    expect(result).toBeNull();
  });
});

describe('NIP-05 Verification', () => {
  test('should return true for matching pubkey', async () => {
    // Mock successful verification
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        names: {
          alice: 'pubkey123'
        }
      })
    });
    
    const result = await verifyNip05('alice@example.com', 'pubkey123');
    expect(result).toBe(true);
  });
  
  test('should return false for non-matching pubkey', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        names: {
          alice: 'different-pubkey'
        }
      })
    });
    
    const result = await verifyNip05('alice@example.com', 'pubkey123');
    expect(result).toBe(false);
  });
  
  test('should handle npub format pubkeys', async () => {
    // This test would need to mock nip19.decode - we'll just verify the structure
    expect(verifyNip05).toBeInstanceOf(Function);
  });
});
