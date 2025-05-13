
// Re-export all encryption-related functionality
import { nostrEncryption } from './nostr-encryption';
import { passwordEncryption } from './password-encryption';
import { encryptionUtils } from './utils';

/**
 * Combined encryption utility for the application
 */
export const encryption = {
  ...nostrEncryption,
  ...passwordEncryption,
  ...encryptionUtils
};

// Export sub-modules for direct access if needed
export { nostrEncryption } from './nostr-encryption';
export { passwordEncryption } from './password-encryption';
export { encryptionUtils } from './utils';
