// Update imports to use available functions from nostr-tools
// Use nip19 or other available modules if generatePrivateKey is not available
import { nip19, getPublicKey } from "nostr-tools";
import { Event } from "nostr-tools";

// Add a function to generate a private key if needed
export const generatePrivateKey = (): string => {
  // Create a secure random 32-byte private key
  const privateKey = new Uint8Array(32);
  window.crypto.getRandomValues(privateKey);
  return Buffer.from(privateKey).toString('hex');
};
