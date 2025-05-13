
import { validateNip25Reaction } from '../nip';
import { NostrEvent } from "../../types";

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
