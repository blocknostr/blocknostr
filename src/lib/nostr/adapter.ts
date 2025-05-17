
// Update the generatePrivateKey function
export const generatePrivateKey = (): string => {
  // Create a secure random 32-byte private key
  const privateKey = new Uint8Array(32);
  window.crypto.getRandomValues(privateKey);
  
  // Convert to hex string
  return Array.from(privateKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Update getPublicKeyFromPrivateKey to accept hex string
export const getPublicKeyFromPrivateKey = (privateKey: string): string => {
  // The nostr-tools getPublicKey function accepts a hex string directly
  return getPublicKey(privateKey);
};
