
import { validateNip10Tags, parseThreadTags } from '../nip';

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
