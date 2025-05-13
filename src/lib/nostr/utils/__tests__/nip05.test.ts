
import { isValidNip05Format, verifyNip05 } from '../nip';

describe('NIP-05 Identifier Validation', () => {
  test('should validate correct NIP-05 identifiers', () => {
    expect(isValidNip05Format('user@example.com')).toBe(true);
    expect(isValidNip05Format('alice@domain.co')).toBe(true);
    expect(isValidNip05Format('bob.name@subdomain.example.org')).toBe(true);
  });
  
  test('should reject invalid NIP-05 identifiers', () => {
    expect(isValidNip05Format('')).toBe(false);
    expect(isValidNip05Format('invalid')).toBe(false);
    expect(isValidNip05Format('@domain.com')).toBe(false);
    expect(isValidNip05Format('user@')).toBe(false);
    expect(isValidNip05Format('user@domain')).toBe(false);
  });
});

// Mock for fetch to test NIP-05 verification
global.fetch = jest.fn();

describe('NIP-05: Identifier Verification', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('should return true for valid verification', async () => {
    // Mock successful response
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
    
    // Verify fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith('https://example.com/.well-known/nostr.json?name=alice');
  });
  
  test('should return false for non-matching pubkey', async () => {
    // Mock successful response but with different pubkey
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
  
  test('should return false for HTTP error', async () => {
    // Mock HTTP error
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    const result = await verifyNip05('alice@example.com', 'pubkey123');
    expect(result).toBe(false);
  });
  
  test('should return false for invalid JSON response', async () => {
    // Mock invalid JSON response
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        // Missing names field
      })
    });
    
    const result = await verifyNip05('alice@example.com', 'pubkey123');
    expect(result).toBe(false);
  });
});
