
import { 
  getAccountCreationDate,
  parseThreadTags,
  verifyNip05,
  checkXVerification,
  parseRelayList
} from '../nip-utilities';
import { NostrEvent } from '../../types';

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

describe('NIP-10: Thread Tags Parsing', () => {
  test('should parse root and reply markers correctly', () => {
    const tags = [
      ['e', 'root-id', '', 'root'],
      ['e', 'reply-id', '', 'reply'],
      ['e', 'mention-id']
    ];
    
    const result = parseThreadTags(tags);
    expect(result.rootId).toBe('root-id');
    expect(result.replyId).toBe('reply-id');
    expect(result.mentions).toContain('mention-id');
  });
  
  test('should handle missing markers correctly', () => {
    const tags = [
      ['e', 'event-id-1'],
      ['e', 'event-id-2']
    ];
    
    const result = parseThreadTags(tags);
    expect(result.rootId).toBe('event-id-1');
    expect(result.replyId).toBe('event-id-1');
    expect(result.mentions).toContain('event-id-2');
  });
  
  test('should handle empty tags', () => {
    const emptyResult = parseThreadTags([]);
    expect(emptyResult.rootId).toBe(null);
    expect(emptyResult.replyId).toBe(null);
    expect(emptyResult.mentions).toHaveLength(0);
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

describe('NIP-39: X Verification Check', () => {
  test('should detect NIP-39 i-tag verification', () => {
    const profileData = {
      name: 'Jack',
      tags: [
        ['i', 'twitter:jack', '1234567890']
      ]
    };
    
    const result = checkXVerification(profileData);
    expect(result.xVerified).toBe(true);
    expect(result.xVerifiedInfo?.username).toBe('jack');
    expect(result.xVerifiedInfo?.tweetId).toBe('1234567890');
  });
  
  test('should fall back to legacy verification', () => {
    const profileData = {
      name: 'Jack',
      twitter: 'jack',
      twitter_verified: true,
      twitter_proof: '1234567890'
    };
    
    const result = checkXVerification(profileData);
    expect(result.xVerified).toBe(true);
    expect(result.xVerifiedInfo?.username).toBe('jack');
    expect(result.xVerifiedInfo?.tweetId).toBe('1234567890');
  });
  
  test('should handle null/undefined profile data', () => {
    const result1 = checkXVerification(null);
    expect(result1.xVerified).toBe(false);
    expect(result1.xVerifiedInfo).toBe(null);
    
    const result2 = checkXVerification(undefined);
    expect(result2.xVerified).toBe(false);
    expect(result2.xVerifiedInfo).toBe(null);
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
