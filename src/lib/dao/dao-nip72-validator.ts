
import { Event } from 'nostr-tools';

/**
 * Validator for NIP-72 event compliance
 * https://github.com/nostr-protocol/nips/blob/master/72.md
 */

export const DAO_EVENT_KINDS = {
  COMMUNITY: 34550,
  PROPOSAL: 34551,
  VOTE: 34552,
  METADATA: 34553,
  MODERATION: 34554,
};

/**
 * Validate a DAO/Community event (kind 34550) according to NIP-72
 */
export function validateCommunityEvent(event: Event): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check basic event structure
  if (!event) {
    return { valid: false, errors: ['Event is undefined'] };
  }
  
  // Check kind
  if (event.kind !== DAO_EVENT_KINDS.COMMUNITY) {
    errors.push(`Invalid kind: ${event.kind}, expected ${DAO_EVENT_KINDS.COMMUNITY}`);
  }
  
  // Check for required 'd' tag (unique identifier)
  const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing required 'd' tag");
  }
  
  // Check for at least one 'p' tag (member)
  const pTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push("Missing required 'p' tag for at least one member");
  }
  
  // Check content is valid JSON with minimum required fields
  try {
    const content = JSON.parse(event.content);
    if (!content.name) {
      errors.push("Missing required 'name' field in content");
    }
  } catch (e) {
    errors.push("Invalid JSON in content");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a DAO proposal event (kind 34551) according to NIP-72
 */
export function validateProposalEvent(event: Event): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check basic event structure
  if (!event) {
    return { valid: false, errors: ['Event is undefined'] };
  }
  
  // Check kind
  if (event.kind !== DAO_EVENT_KINDS.PROPOSAL) {
    errors.push(`Invalid kind: ${event.kind}, expected ${DAO_EVENT_KINDS.PROPOSAL}`);
  }
  
  // Check for required 'e' tag (reference to community)
  const eTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag referencing the community");
  }
  
  // Check for unique identifier
  const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing required 'd' tag for proposal unique identifier");
  }
  
  // Check content is valid JSON with minimum required fields
  try {
    const content = JSON.parse(event.content);
    if (!content.title) {
      errors.push("Missing required 'title' field in content");
    }
    if (!Array.isArray(content.options)) {
      errors.push("Missing or invalid 'options' array in content");
    } else if (content.options.length < 2) {
      errors.push("Proposal must have at least 2 options");
    }
  } catch (e) {
    errors.push("Invalid JSON in content");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a vote event (kind 34552) according to NIP-72
 */
export function validateVoteEvent(event: Event): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check basic event structure
  if (!event) {
    return { valid: false, errors: ['Event is undefined'] };
  }
  
  // Check kind
  if (event.kind !== DAO_EVENT_KINDS.VOTE) {
    errors.push(`Invalid kind: ${event.kind}, expected ${DAO_EVENT_KINDS.VOTE}`);
  }
  
  // Check for required 'e' tag (reference to proposal)
  const eTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag referencing the proposal");
  }
  
  // Check content for valid vote
  let validVote = false;
  try {
    // Try JSON format first (preferred but both supported by NIP-72)
    const content = JSON.parse(event.content);
    if (typeof content.optionIndex === 'number') {
      validVote = true;
    }
  } catch (e) {
    // Try plain number format
    const optionIndex = parseInt(event.content.trim());
    if (!isNaN(optionIndex)) {
      validVote = true;
    }
  }
  
  if (!validVote) {
    errors.push("Invalid vote format. Must be either a JSON object with optionIndex or a plain number");
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Create a NIP-72 compliant community event
 */
export function createCommunityEvent(name: string, description: string, creator: string, uniqueId?: string): Event {
  const timestamp = Math.floor(Date.now() / 1000);
  const daoId = uniqueId || `dao_${Math.random().toString(36).substring(2, 10)}`;
  
  const communityData = {
    name,
    description,
    creator,
    createdAt: timestamp
  };
  
  return {
    kind: DAO_EVENT_KINDS.COMMUNITY,
    created_at: timestamp,
    content: JSON.stringify(communityData),
    tags: [
      ["d", daoId],
      ["p", creator]
    ],
    pubkey: creator,
    id: "", // To be computed by nostr library
    sig: "" // To be computed by nostr library
  };
}
