
import { validateNip01Event, getAccountCreationDate } from '../nip';
import { NostrEvent } from "../../types";

describe('NIP-01 Event Validation', () => {
  test('should validate a valid event', () => {
    const validEvent: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 1,
      tags: [['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']],
      content: 'Hello, world!',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip01Event(validEvent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should detect missing required fields', () => {
    const invalidEvent = {
      kind: 1,
      tags: [],
      content: 'Missing fields'
    };
    
    const result = validateNip01Event(invalidEvent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing id field');
    expect(result.errors).toContain('Missing pubkey field');
    expect(result.errors).toContain('Missing created_at field');
    expect(result.errors).toContain('Missing sig field');
  });
  
  test('should validate tags structure', () => {
    const eventWithInvalidTags: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 1,
      tags: [['p', 123] as any],
      content: 'Invalid tags',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip01Event(eventWithInvalidTags);
    expect(result.valid).toBe(false);
  });
});

describe('NIP-01: Account Creation Date', () => {
  test('should return null for empty events array', () => {
    expect(getAccountCreationDate([])).toBe(null);
  });
  
  test('should find earliest metadata event', () => {
    const events: NostrEvent[] = [
      {
        id: 'event1',
        pubkey: 'pubkey1',
        created_at: 1652000000, // May 8, 2022
        kind: 0,
        tags: [],
        content: '{"name":"Test"}',
        sig: 'sig1'
      },
      {
        id: 'event2',
        pubkey: 'pubkey1',
        created_at: 1651000000, // April 27, 2022 (earlier)
        kind: 0,
        tags: [],
        content: '{"name":"Earlier"}',
        sig: 'sig2'
      },
      {
        id: 'event3',
        pubkey: 'pubkey1',
        created_at: 1653000000, // May 20, 2022
        kind: 1, // Not metadata, should be ignored
        tags: [],
        content: 'Not metadata',
        sig: 'sig3'
      }
    ];
    
    const result = getAccountCreationDate(events);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getTime()).toBe(1651000000 * 1000);
  });
  
  test('should ignore non-metadata events', () => {
    const events: NostrEvent[] = [
      {
        id: 'event1',
        pubkey: 'pubkey1',
        created_at: 1652000000,
        kind: 1, // Not metadata
        tags: [],
        content: 'Not metadata',
        sig: 'sig1'
      }
    ];
    
    const result = getAccountCreationDate(events);
    expect(result).toBe(null);
  });
});
