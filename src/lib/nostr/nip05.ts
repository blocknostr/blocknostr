
/**
 * NIP-05 module backward compatibility wrapper
 * This file provides a backward-compatibility layer around the consolidated NIP-05 implementation
 */
import { 
  fetchNip05Data, 
  getNip05Pubkey, 
  verifyNip05, 
  discoverNip05Relays,
  isValidNip05Format
} from './utils/nip';

// Re-export the functions from the consolidated module
export { 
  fetchNip05Data, 
  getNip05Pubkey, 
  verifyNip05, 
  discoverNip05Relays,
  isValidNip05Format
};
