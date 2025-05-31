
import { validateEvent } from '../nip/validator';
import { NostrEvent } from "../../types";

describe('NIP Validator', () => {
  test('should validate events against multiple NIPs', () => {
    const event: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234', '', 'reply'],
        ['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']
      ],
      content: 'Test content',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const results = validateEvent(event);
    
    // Check that each NIP validator was called
    expect(results['NIP-01']).toBeDefined();
    expect(results['NIP-10']).toBeDefined();
    expect(results['NIP-25']).toBeDefined();
    expect(results['NIP-36']).toBeDefined();
    expect(results['NIP-65']).toBeDefined();
    
    // The event should be valid for NIP-01 (general event structure)
    expect(results['NIP-01'].valid).toBe(true);
    
    // Should also be valid for NIP-10 (e tags for thread handling)
    expect(results['NIP-10'].valid).toBe(true);
  });
});

