
import { 
  hasContentWarning,
  getContentWarningReasons,
  addContentWarning,
  validateNip36ContentWarning
} from '../nip';
import { NostrEvent } from "../../types";

describe('NIP-36: Content Warning Tests', () => {
  test('should detect content warning tag', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['content-warning', 'nsfw']
      ],
      content: 'Test content with warning',
      sig: 'test-sig'
    };
    
    expect(hasContentWarning(event)).toBe(true);
  });
  
  test('should return false when no content warning tag present', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['p', 'some-pubkey']
      ],
      content: 'Test content without warning',
      sig: 'test-sig'
    };
    
    expect(hasContentWarning(event)).toBe(false);
  });
  
  test('should handle null or undefined events gracefully', () => {
    expect(hasContentWarning(null as unknown as NostrEvent)).toBe(false);
    expect(hasContentWarning(undefined as unknown as NostrEvent)).toBe(false);
    expect(hasContentWarning({} as NostrEvent)).toBe(false);
  });
  
  test('should extract content warning reasons', () => {
    const event: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['content-warning', 'nsfw'],
        ['content-warning', 'violence'],
        ['other-tag', 'value']
      ],
      content: 'Test content with warnings',
      sig: 'test-sig'
    };
    
    const reasons = getContentWarningReasons(event);
    expect(reasons).toContain('nsfw');
    expect(reasons).toContain('violence');
    expect(reasons).toHaveLength(2);
  });
  
  test('should add content warning to event', () => {
    const originalEvent: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [],
      content: 'Test content',
      sig: 'test-sig'
    };
    
    const withWarning = addContentWarning(originalEvent, 'nsfw');
    expect(withWarning.tags).toHaveLength(1);
    expect(withWarning.tags[0][0]).toBe('content-warning');
    expect(withWarning.tags[0][1]).toBe('nsfw');
    
    const withGenericWarning = addContentWarning(originalEvent);
    expect(withGenericWarning.tags).toHaveLength(1);
    expect(withGenericWarning.tags[0][0]).toBe('content-warning');
    expect(withGenericWarning.tags[0]).toHaveLength(1);
  });
  
  test('should validate content warning tags', () => {
    const validEvent: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['content-warning', 'nsfw']
      ],
      content: 'Test content',
      sig: 'test-sig'
    };
    
    const invalidEvent: NostrEvent = {
      id: 'test-id',
      pubkey: 'test-pubkey',
      created_at: 1652000000,
      kind: 1,
      tags: [
        ['content-warning', 'nsfw', 'extra-element']
      ],
      content: 'Test content',
      sig: 'test-sig'
    };
    
    const validResult = validateNip36ContentWarning(validEvent);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    const invalidResult = validateNip36ContentWarning(invalidEvent);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});
