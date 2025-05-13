
import { validateNip65RelayList, parseRelayList } from '../nip';
import { NostrEvent } from "../../types";

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

describe('NIP-65: Relay List Parsing', () => {
  test('should parse relay list with read/write preferences', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r', 'wss://relay1.com', 'read'],
        ['r', 'wss://relay2.com', 'write'],
        ['r', 'wss://relay3.com', 'read', 'write']
      ],
      content: '',
      sig: 'test-sig'
    };
    
    const result = parseRelayList(event);
    
    expect(result.size).toBe(3);
    expect(result.get('wss://relay1.com')).toEqual({ read: true, write: false });
    expect(result.get('wss://relay2.com')).toEqual({ read: false, write: true });
    expect(result.get('wss://relay3.com')).toEqual({ read: true, write: true });
  });
  
  test('should default to both read and write when no markers given', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r', 'wss://relay.com']
      ],
      content: '',
      sig: 'test-sig'
    };
    
    const result = parseRelayList(event);
    
    expect(result.size).toBe(1);
    expect(result.get('wss://relay.com')).toEqual({ read: true, write: true });
  });
  
  test('should handle malformed relay tags gracefully', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 10002,
      tags: [
        ['r'], // Missing URL
        ['r', 'wss://valid.com'],
        ['other-tag', 'not-a-relay']
      ],
      content: '',
      sig: 'test-sig'
    };
    
    const result = parseRelayList(event);
    
    expect(result.size).toBe(1);
    expect(result.get('wss://valid.com')).toEqual({ read: true, write: true });
  });
});
