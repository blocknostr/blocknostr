
// This file provides backward compatibility with the old encryption module
// It re-exports all functionality from the new modularized version

export { encryption } from './encryption/index';
export { nostrEncryption } from './encryption/nostr-encryption';
export { passwordEncryption } from './encryption/password-encryption';
export { encryptionUtils } from './encryption/utils';

// Re-export the default export as well
import { encryption as defaultExport } from './encryption/index';
export default defaultExport;
