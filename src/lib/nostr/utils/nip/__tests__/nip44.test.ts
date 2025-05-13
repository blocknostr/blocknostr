
import { encrypt, decrypt } from '../nip44';
import * as secp from '@noble/secp256k1';

describe('NIP-44 Versioned Encryption', () => {
  // Helper function to generate test keys
  const generateTestKey = () => {
    const privateKey = secp.utils.randomPrivateKey();
    const publicKey = secp.getPublicKey(privateKey, true).slice(1); // Remove prefix
    return {
      privateKey: Buffer.from(privateKey).toString('hex'),
      publicKey: Buffer.from(publicKey).toString('hex')
    };
  };
  
  it('should encrypt and decrypt a message', () => {
    // Generate two key pairs for testing
    const alice = generateTestKey();
    const bob = generateTestKey();
    
    const plaintext = 'Hello, NIP-44 encryption test!';
    
    // Alice encrypts a message to Bob
    const encrypted = encrypt({
      plaintext,
      privateKey: alice.privateKey,
      publicKey: bob.publicKey
    });
    
    // Bob decrypts the message from Alice
    const decrypted = decrypt({
      ciphertext: encrypted,
      privateKey: bob.privateKey,
      publicKey: alice.publicKey
    });
    
    expect(decrypted).toBe(plaintext);
  });
  
  it('should handle empty messages', () => {
    const alice = generateTestKey();
    const bob = generateTestKey();
    
    const plaintext = '';
    
    const encrypted = encrypt({
      plaintext,
      privateKey: alice.privateKey,
      publicKey: bob.publicKey
    });
    
    const decrypted = decrypt({
      ciphertext: encrypted,
      privateKey: bob.privateKey,
      publicKey: alice.publicKey
    });
    
    expect(decrypted).toBe(plaintext);
  });
  
  // Add more tests as needed
});
