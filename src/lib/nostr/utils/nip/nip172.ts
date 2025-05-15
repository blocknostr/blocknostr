
import { NostrEvent } from "../../types";
import { EVENT_KINDS } from "../../constants";

/**
 * NIP-172: Community and Group Event Specification
 * @see https://github.com/nostr-protocol/nips/blob/master/172.md
 * 
 * Validates community events according to the NIP-172 specification
 */
export function validateCommunityEvent(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!event) {
    return { valid: false, errors: ['Event is undefined or null'] };
  }
  
  // Validate this is a community event
  if (event.kind !== EVENT_KINDS.COMMUNITY) {
    errors.push(`Event kind must be ${EVENT_KINDS.COMMUNITY} for community events, got ${event.kind}`);
  }
  
  // Community events must have a 'd' tag for unique identifier
  const dTag = event.tags.find((tag: string[]) => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing 'd' tag for community identifier");
  }
  
  // Check required content fields in JSON
  try {
    const content = JSON.parse(event.content);
    
    if (!content.name || typeof content.name !== 'string' || content.name.trim() === '') {
      errors.push("Community must have a valid name");
    }
    
    if (!content.description || typeof content.description !== 'string') {
      errors.push("Community must have a description");
    }
    
    if (!content.creator || typeof content.creator !== 'string') {
      errors.push("Community must have a creator");
    }
    
    if (!content.createdAt || typeof content.createdAt !== 'number') {
      errors.push("Community must have a valid createdAt timestamp");
    }
  } catch (e) {
    errors.push("Community content must be valid JSON");
  }
  
  // Community creator should be included as a 'p' tag
  const hasCreatorTag = event.tags.some((tag: string[]) => 
    tag.length >= 2 && tag[0] === 'p' && tag[1] === event.pubkey
  );
  
  if (!hasCreatorTag) {
    errors.push("Community creator must be included as a 'p' tag");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates proposal events according to NIP-172
 */
export function validateProposalEvent(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (event.kind !== EVENT_KINDS.PROPOSAL) {
    errors.push(`Event kind must be ${EVENT_KINDS.PROPOSAL} for proposal events, got ${event.kind}`);
  }
  
  // Proposals must reference a community with 'e' tag
  const communityReference = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!communityReference) {
    errors.push("Proposal must reference a community with 'e' tag");
  }
  
  // Proposals must have a 'd' tag for unique identifier
  const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing 'd' tag for proposal identifier");
  }
  
  // Check proposal content
  try {
    const content = JSON.parse(event.content);
    
    if (!content.title || typeof content.title !== 'string' || content.title.trim() === '') {
      errors.push("Proposal must have a valid title");
    }
    
    if (!Array.isArray(content.options) || content.options.length < 2) {
      errors.push("Proposal must have at least two options");
    }
    
    if (!content.endsAt || typeof content.endsAt !== 'number') {
      errors.push("Proposal must have a valid endsAt timestamp");
    }
  } catch (e) {
    errors.push("Proposal content must be valid JSON");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validates vote events according to NIP-172
 */
export function validateVoteEvent(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (event.kind !== EVENT_KINDS.VOTE) {
    errors.push(`Event kind must be ${EVENT_KINDS.VOTE} for vote events, got ${event.kind}`);
  }
  
  // Votes must reference a proposal with 'e' tag
  const proposalReference = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!proposalReference) {
    errors.push("Vote must reference a proposal with 'e' tag");
  }
  
  // Check vote content
  try {
    const optionIndex = parseInt(event.content);
    if (isNaN(optionIndex) || optionIndex < 0) {
      errors.push("Vote content must be a valid non-negative number representing the option index");
    }
  } catch (e) {
    errors.push("Vote content must be a valid option index");
  }
  
  return { valid: errors.length === 0, errors };
}
