
import { 
  validateNip01Event, 
  validateNip10Tags, 
  validateNip25Reaction,
  validateNip39Claim,
  validateNip65RelayList,
  isValidNip05Format
} from '../nip-validator';
import { NostrEvent } from '../../types';

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
    expect(result.errors).toContain('Tag element at index 0,1 must be a string');
  });
});

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

describe('NIP-10 Tags Validation', () => {
  test('should validate correctly formed e-tags', () => {
    const validTags = [
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'],
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234', 'wss://relay.example.com'],
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234', 'wss://relay.example.com', 'root'],
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234', '', 'reply']
    ];
    
    const result = validateNip10Tags(validTags);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should detect invalid e-tag event IDs', () => {
    const invalidTags = [
      ['e', 'not-a-hex-string'],
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef12'], // too short
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef12345'] // too long
    ];
    
    const result = validateNip10Tags(invalidTags);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('should detect invalid e-tag markers', () => {
    const invalidMarkerTags = [
      ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234', '', 'invalid-marker']
    ];
    
    const result = validateNip10Tags(invalidMarkerTags);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('E-tag at index 0 has an invalid marker: invalid-marker');
  });
});

describe('NIP-25 Reaction Validation', () => {
  test('should validate a valid reaction event', () => {
    const validReaction: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 7,
      tags: [
        ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'],
        ['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']
      ],
      content: '+',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip25Reaction(validReaction);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should validate emoji reaction', () => {
    const emojiReaction: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 7,
      tags: [
        ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'],
        ['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']
      ],
      content: '❤️',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip25Reaction(emojiReaction);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should detect invalid reaction kind', () => {
    const invalidReaction: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 1, // Invalid kind for reaction
      tags: [
        ['e', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'],
        ['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']
      ],
      content: '+',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip25Reaction(invalidReaction);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Reaction event must have kind 7');
  });
  
  test('should detect missing e tag', () => {
    const reactionWithoutETag: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 7,
      tags: [
        ['p', '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234']
      ],
      content: '+',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip25Reaction(reactionWithoutETag);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Reaction must have at least one e tag referencing the event being reacted to');
  });
});

describe('NIP-39 External Identity Verification', () => {
  test('should validate a valid Twitter/X verification claim', () => {
    const validVerification: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 0,
      tags: [
        ['i', 'twitter:jack', '1234567890', 'https://twitter.com/jack/status/1234567890']
      ],
      content: '{"name":"Jack","about":"Creator of Twitter"}',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip39Claim(validVerification);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should detect missing platform or identifier', () => {
    const invalidVerification: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 0,
      tags: [
        ['i', 'twitter', '1234567890'] // Missing username after platform
      ],
      content: '{"name":"Jack","about":"Creator of Twitter"}',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip39Claim(invalidVerification);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('should detect wrong event kind', () => {
    const wrongKindVerification: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 1, // Should be kind 0
      tags: [
        ['i', 'twitter:jack', '1234567890']
      ],
      content: 'Not a metadata event',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip39Claim(wrongKindVerification);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('External identity claim must be in a kind 0 event');
  });
});

describe('NIP-65 Relay List Validation', () => {
  test('should validate a valid relay list event', () => {
    const validRelayList: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r', 'wss://relay.nostr.org', 'read', 'write'],
        ['r', 'wss://nos.lol', 'read'],
        ['r', 'wss://relay.snort.social', 'write']
      ],
      content: '',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip65RelayList(validRelayList);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should detect invalid relay URLs', () => {
    const invalidRelayList: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r', 'http://not-websocket.com', 'read', 'write'], // Not a WebSocket URL
        ['r', 'invalid-url', 'read']
      ],
      content: '',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip65RelayList(invalidRelayList);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('should detect invalid read/write markers', () => {
    const invalidMarkers: NostrEvent = {
      id: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      pubkey: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r', 'wss://relay.nostr.org', 'invalid-marker']
      ],
      content: '',
      sig: '123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234123456789abcdef123456789abcdef123456789abcdef123456789abcdef1234'
    };
    
    const result = validateNip65RelayList(invalidMarkers);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Relay tag at index 0 has invalid marker: invalid-marker, must be 'read' or 'write'");
  });
});
