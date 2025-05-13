
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";
import { validateNip10Tags } from "./nip10";
import { validateNip25Reaction } from "./nip25";
import { validateNip39Claim } from "./nip39";
import { validateNip44Event } from "./nip44";
import { validateNip65RelayList } from "./nip65";

/**
 * Comprehensive testing function to test NIP implementations on the current event
 */
export function testNipImplementations(event: NostrEvent): Record<string, {valid: boolean, errors: string[]}> {
  return {
    'NIP-01': validateNip01Event(event),
    'NIP-10': validateNip10Tags(event.tags),
    'NIP-25': event.kind === 7 ? validateNip25Reaction(event) : { valid: true, errors: ['Not a reaction event'] },
    'NIP-39': event.kind === 0 ? validateNip39Claim(event) : { valid: true, errors: ['Not a metadata event'] },
    'NIP-44': event.kind === 4 ? validateNip44Event(event) : { valid: true, errors: ['Not an encrypted DM event'] },
    'NIP-65': event.kind === 10002 ? validateNip65RelayList(event) : { valid: true, errors: ['Not a relay list event'] }
  };
}
