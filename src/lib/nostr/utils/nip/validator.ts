
import { NostrEvent } from "../../types";
import { validateNip01Event } from "./nip01";
import { validateNip10Tags } from "./nip10";
import { validateNip25Reaction } from "./nip25";
import { validateNip36ContentWarning } from "./nip36";
import { validateNip65RelayList } from "./nip65";

/**
 * Validates an event against multiple NIPs
 * @param event The event to validate
 * @returns Object containing validation results for each NIP
 */
export function validateEvent(event: NostrEvent): Record<string, { valid: boolean; errors: string[] }> {
  const results: Record<string, { valid: boolean; errors: string[] }> = {};
  
  // Validate basic event structure (NIP-01)
  results['NIP-01'] = validateNip01Event(event);
  
  // Validate thread tags (NIP-10)
  results['NIP-10'] = validateNip10Tags(event.tags);
  
  // Validate reaction format if it's a reaction event (NIP-25)
  if (event.kind === 7) {
    results['NIP-25'] = validateNip25Reaction(event);
  }
  
  // Validate content warning tags (NIP-36)
  results['NIP-36'] = validateNip36ContentWarning(event);
  
  // Validate relay list if it's a relay list event (NIP-65)
  if (event.kind === 10002) {
    results['NIP-65'] = validateNip65RelayList(event);
  }
  
  return results;
}

/**
 * Checks if an event is fully compliant with all applicable NIPs
 * @param event The event to validate
 * @returns Object with overall validation result and per-NIP results
 */
export function isEventCompliant(event: NostrEvent): { 
  compliant: boolean;
  results: Record<string, { valid: boolean; errors: string[] }> 
} {
  const results = validateEvent(event);
  
  // Check if all applicable validations passed
  const compliant = Object.values(results).every(result => result.valid);
  
  return {
    compliant,
    results
  };
}
