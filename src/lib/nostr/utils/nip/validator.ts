
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";
import { validateNip10Tags } from "./nip10";
import { validateNip25Reaction } from "./nip25";
import { validateNip36ContentWarning } from "./nip36";
import { validateNip65RelayList } from "./nip65";
import { validateCommunityEvent, validateProposalEvent, validateVoteEvent } from "./nip172";
import { EVENT_KINDS } from "../../constants";

/**
 * Validate an event against multiple NIPs
 */
export function validateEvent(event: NostrEvent): Record<string, { valid: boolean; errors: string[] }> {
  const result = {
    'NIP-01': validateNip01Event(event),
    'NIP-10': validateNip10Tags(event.tags),
    'NIP-25': event.kind === 7 ? validateNip25Reaction(event) : { valid: true, errors: ['Not a reaction event'] },
    'NIP-36': validateNip36ContentWarning(event),
    'NIP-65': event.kind === 10002 ? validateNip65RelayList(event) : { valid: true, errors: ['Not a relay list event'] }
  };
  
  // Add NIP-172 validations for community events
  if (event.kind === EVENT_KINDS.COMMUNITY) {
    result['NIP-172-community'] = validateCommunityEvent(event);
  } else if (event.kind === EVENT_KINDS.PROPOSAL) {
    result['NIP-172-proposal'] = validateProposalEvent(event);
  } else if (event.kind === EVENT_KINDS.VOTE) {
    result['NIP-172-vote'] = validateVoteEvent(event);
  }
  
  return result;
}
