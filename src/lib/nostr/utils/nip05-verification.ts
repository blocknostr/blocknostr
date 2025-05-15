
/**
 * Legacy NIP-05 verification utilities
 * @deprecated Use the consolidated implementation from ./nip/nip05.ts instead
 */

import { isValidNip05Format, fetchNip05Data, verifyNip05 } from './nip';

// Re-export the updated implementations for backward compatibility
export { isValidNip05Format, fetchNip05Data, verifyNip05 };
