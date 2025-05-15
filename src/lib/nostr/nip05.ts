
/**
 * NIP-05 module backward compatibility wrapper
 * This file provides a backward-compatibility layer around the consolidated NIP-05 implementation
 */
import { fetchNip05Data, getNip05Pubkey, discoverNip05Relays } from './utils/nip';

export { fetchNip05Data, getNip05Pubkey as verifyNip05, discoverNip05Relays };
