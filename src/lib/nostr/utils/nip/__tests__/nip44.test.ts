
import { encrypt, decrypt, isNip44Message, validateNip44Event } from '../nip44';
import { generatePrivateKey, getPublicKey } from 'nostr-tools';

describe('NIP-44 Encrypted Payloads', () => {
  // Generate test keys
  const alicePrivateKey = generatePrivateKey();
  const alicePublicKey = getPublicKey(alicePrivateKey);
  const bobPrivateKey = generatePrivateKey();
  const bobPublicKey = getPublicKey(bobPrivateKey);

  test('should encrypt and decrypt a message', () => {
    const plaintext = 'Hello, this is a test message!';
    
    // Alice encrypts a message to Bob
    const encrypted = encrypt(plaintext, alicePrivateKey, bobPublicKey);
    
    // Bob decrypts the message from Alice
    const decrypted = decrypt(encrypted, bobPrivateKey, alicePublicKey);
    
    // The decrypted message should match the original
    expect(decrypted).toBe(plaintext);
  });

  test('should detect NIP-44 messages', () => {
    const plaintext = 'This is a NIP-44 message';
    const encrypted = encrypt(plaintext, alicePrivateKey, bobPublicKey);
    
    expect(isNip44Message(encrypted)).toBe(true);
    expect(isNip44Message('not encrypted content')).toBe(false);
  });

  test('should validate NIP-44 events', () => {
    const plaintext = 'This is a NIP-44 direct message';
    const encrypted = encrypt(plaintext, alicePrivateKey, bobPublicKey);
    
    const validEvent = {
      kind: 4,
      content: encrypted,
      tags: [['p', bobPublicKey]],
      pubkey: alicePublicKey,
      created_at: Math.floor(Date.now() / 1000),
      id: 'dummy-id',
      sig: 'dummy-sig'
    };
    
    const invalidEvent = {
      kind: 1, // Wrong kind
      content: 'not encrypted',
      tags: [], // Missing p tag
      pubkey: alicePublicKey,
      created_at: Math.floor(Date.now() / 1000),
      id: 'dummy-id',
      sig: 'dummy-sig'
    };
    
    const validResult = validateNip44Event(validEvent);
    const invalidResult = validateNip44Event(invalidEvent);
    
    expect(validResult.valid).toBe(true);
    expect(validResult.errors.length).toBe(0);
    
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });
});
