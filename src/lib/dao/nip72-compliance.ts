import { Event } from 'nostr-tools';

/**
 * NIP-72 Compliance Checker
 * Ensures all community events follow the NIP-72 specification
 * https://github.com/nostr-protocol/nips/blob/master/72.md
 */

// NIP-72 Event Kinds
export const NIP72_KINDS = {
  COMMUNITY: 34550,       // Community definition
  PROPOSAL: 34551,        // Community proposal  
  VOTE: 34552,           // Vote on a proposal
  METADATA: 34553,       // Community metadata (guidelines, etc)
  MODERATION: 34554,      // Moderation events (kick, ban)
  INVITE: 34555,         // Invite to private community
  POST_APPROVAL: 4550,   // Post approval by moderators
  POST_REJECTION: 4551,  // Post rejection by moderators
  MODERATION_LOG: 4552,  // Moderation action logging
  CONTENT_REPORT: 4553,  // Content reporting by users
  MEMBER_BAN: 4554,      // Member ban/unban actions
} as const;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  eventType: string;
}

/**
 * Validate a Community Definition Event (kind 34550)
 */
export function validateCommunityEvent(event: Event): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check basic event structure
  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'], warnings: [], eventType: 'community' };
  }

  // Check kind
  if (event.kind !== NIP72_KINDS.COMMUNITY) {
    errors.push(`Invalid kind: ${event.kind}, expected ${NIP72_KINDS.COMMUNITY}`);
  }

  // Check for required 'd' tag (unique identifier)
  const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing required 'd' tag for unique identifier");
  } else if (!dTag[1] || dTag[1].trim() === '') {
    errors.push("Empty 'd' tag value");
  }

  // Check for at least one 'p' tag (member)
  const pTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push("Missing required 'p' tag for at least one member");
  }

  // Validate p tags format
  pTags.forEach((tag, index) => {
    if (tag.length < 2 || !tag[1]) {
      errors.push(`Invalid p tag at index ${index}: missing pubkey`);
    } else if (tag[1].length !== 64) {
      warnings.push(`P tag at index ${index}: pubkey should be 64 characters (hex)`);
    }
    
    // Check role if specified
    if (tag.length >= 3 && tag[2]) {
      const validRoles = ['', 'moderator', 'banned'];
      if (!validRoles.includes(tag[2])) {
        warnings.push(`P tag at index ${index}: unknown role '${tag[2]}'`);
      }
    }
  });

  // Check content is valid JSON with minimum required fields
  try {
    const content = JSON.parse(event.content);
    
    if (!content.name || typeof content.name !== 'string') {
      errors.push("Missing or invalid 'name' field in content");
    } else if (content.name.trim() === '') {
      errors.push("Empty 'name' field in content");
    }

    if (content.description && typeof content.description !== 'string') {
      warnings.push("Description field should be a string");
    }

    if (content.creator && content.creator !== event.pubkey) {
      warnings.push("Creator in content doesn't match event pubkey");
    }

    if (content.tags && !Array.isArray(content.tags)) {
      warnings.push("Tags field should be an array");
    }

  } catch (e) {
    errors.push("Invalid JSON in content");
  }

  // Check event signature and id (basic validation)
  if (!event.id || event.id.length !== 64) {
    errors.push("Invalid or missing event ID");
  }

  if (!event.sig || event.sig.length !== 128) {
    errors.push("Invalid or missing event signature");
  }

  if (!event.pubkey || event.pubkey.length !== 64) {
    errors.push("Invalid or missing event pubkey");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventType: 'community'
  };
}

/**
 * Validate a Community Proposal Event (kind 34551)
 */
export function validateProposalEvent(event: Event): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'], warnings: [], eventType: 'proposal' };
  }

  // Check kind
  if (event.kind !== NIP72_KINDS.PROPOSAL) {
    errors.push(`Invalid kind: ${event.kind}, expected ${NIP72_KINDS.PROPOSAL}`);
  }

  // Check for required 'e' tag (reference to community)
  const eTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag referencing the community");
  } else if (!eTag[1] || eTag[1].length !== 64) {
    errors.push("Invalid community reference in 'e' tag");
  }

  // Check for unique identifier
  const dTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
  if (!dTag) {
    errors.push("Missing required 'd' tag for proposal unique identifier");
  }

  // Check content is valid JSON with minimum required fields
  try {
    const content = JSON.parse(event.content);
    
    if (!content.title || typeof content.title !== 'string') {
      errors.push("Missing or invalid 'title' field in content");
    }

    if (!Array.isArray(content.options)) {
      errors.push("Missing or invalid 'options' array in content");
    } else if (content.options.length < 2) {
      errors.push("Proposal must have at least 2 options");
    }

    if (content.endsAt && (typeof content.endsAt !== 'number' || content.endsAt <= event.created_at)) {
      warnings.push("Invalid or past end time for proposal");
    }

  } catch (e) {
    errors.push("Invalid JSON in content");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventType: 'proposal'
  };
}

/**
 * Validate a Vote Event (kind 34552)
 */
export function validateVoteEvent(event: Event): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'], warnings: [], eventType: 'vote' };
  }

  // Check kind
  if (event.kind !== NIP72_KINDS.VOTE) {
    errors.push(`Invalid kind: ${event.kind}, expected ${NIP72_KINDS.VOTE}`);
  }

  // Check for required 'e' tag (reference to proposal)
  const eTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag referencing the proposal");
  }

  // Check content is a valid option index
  try {
    const optionIndex = parseInt(event.content.trim());
    if (isNaN(optionIndex) || optionIndex < 0) {
      errors.push("Content must be a valid non-negative option index");
    }
  } catch (e) {
    errors.push("Invalid content format for vote");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventType: 'vote'
  };
}

/**
 * Validate a Post Approval Event (kind 4550)
 */
export function validatePostApprovalEvent(event: Event): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'], warnings: [], eventType: 'post_approval' };
  }

  // Check kind
  if (event.kind !== NIP72_KINDS.POST_APPROVAL) {
    errors.push(`Invalid kind: ${event.kind}, expected ${NIP72_KINDS.POST_APPROVAL}`);
  }

  // Check for required 'a' tag (community reference)
  const aTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'a');
  if (!aTag) {
    errors.push("Missing required 'a' tag referencing the community");
  } else if (!aTag[1].startsWith('34550:')) {
    errors.push("Invalid 'a' tag format, should start with '34550:'");
  }

  // Check for required 'e' tag (post reference)
  const eTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag referencing the post");
  }

  // Check for required 'p' tag (post author)
  const pTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'p');
  if (!pTag) {
    errors.push("Missing required 'p' tag for post author");
  }

  // Check for required 'k' tag (original post kind)
  const kTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'k');
  if (!kTag) {
    warnings.push("Missing 'k' tag for original post kind");
  }

  // Check content contains original post (NIP-18 style)
  try {
    const originalPost = JSON.parse(event.content);
    if (!originalPost.id || !originalPost.content || !originalPost.pubkey) {
      errors.push("Content must contain valid original post data");
    }
  } catch (e) {
    errors.push("Invalid JSON in content for original post");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventType: 'post_approval'
  };
}

/**
 * Validate a Content Report Event (kind 4553)
 */
export function validateContentReportEvent(event: Event): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event) {
    return { valid: false, errors: ['Event is null or undefined'], warnings: [], eventType: 'content_report' };
  }

  // Check kind
  if (event.kind !== NIP72_KINDS.CONTENT_REPORT) {
    errors.push(`Invalid kind: ${event.kind}, expected ${NIP72_KINDS.CONTENT_REPORT}`);
  }

  // Check for required 'a' tag (community reference)
  const aTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'a');
  if (!aTag) {
    errors.push("Missing required 'a' tag referencing the community");
  }

  // Check for required 'e' tag (target content)
  const eTag = event.tags.find(tag => tag.length >= 3 && tag[0] === 'e');
  if (!eTag) {
    errors.push("Missing required 'e' tag for target content");
  } else if (!eTag[2] || !['post', 'comment', 'user'].includes(eTag[2])) {
    warnings.push("E tag should specify target type (post, comment, user)");
  }

  // Check for report category
  const reportTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'report');
  if (!reportTag) {
    warnings.push("Missing 'report' tag for category");
  } else {
    const validCategories = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other'];
    if (!validCategories.includes(reportTag[1])) {
      warnings.push(`Unknown report category: ${reportTag[1]}`);
    }
  }

  // Check content structure
  try {
    const content = JSON.parse(event.content);
    if (!content.reason || typeof content.reason !== 'string') {
      errors.push("Missing or invalid 'reason' field in content");
    }
    if (!content.targetType || !['post', 'comment', 'user'].includes(content.targetType)) {
      errors.push("Missing or invalid 'targetType' field in content");
    }
  } catch (e) {
    errors.push("Invalid JSON in content");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    eventType: 'content_report'
  };
}

/**
 * Main validation function that routes to specific validators
 */
export function validateNIP72Event(event: Event): ValidationResult {
  if (!event || !event.kind) {
    return { valid: false, errors: ['Invalid event structure'], warnings: [], eventType: 'unknown' };
  }

  switch (event.kind) {
    case NIP72_KINDS.COMMUNITY:
      return validateCommunityEvent(event);
    case NIP72_KINDS.PROPOSAL:
      return validateProposalEvent(event);
    case NIP72_KINDS.VOTE:
      return validateVoteEvent(event);
    case NIP72_KINDS.POST_APPROVAL:
      return validatePostApprovalEvent(event);
    case NIP72_KINDS.CONTENT_REPORT:
      return validateContentReportEvent(event);
    default:
      return {
        valid: false,
        errors: [`Unsupported NIP-72 event kind: ${event.kind}`],
        warnings: [],
        eventType: 'unknown'
      };
  }
}

/**
 * Batch validate multiple events
 */
export function validateNIP72Events(events: Event[]): { 
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  results: ValidationResult[];
} {
  const results = events.map(event => validateNIP72Event(event));
  const validEvents = results.filter(r => r.valid).length;
  
  return {
    totalEvents: events.length,
    validEvents,
    invalidEvents: events.length - validEvents,
    results
  };
}

/**
 * Generate a compliance report for a community
 */
export function generateComplianceReport(events: Event[]): {
  summary: {
    totalEvents: number;
    compliantEvents: number;
    complianceRate: number;
    criticalErrors: number;
    warnings: number;
  };
  eventBreakdown: Record<string, number>;
  issues: Array<{
    eventId: string;
    eventType: string;
    severity: 'error' | 'warning';
    message: string;
  }>;
} {
  const results = validateNIP72Events(events);
  const issues: Array<{
    eventId: string;
    eventType: string;
    severity: 'error' | 'warning';
    message: string;
  }> = [];

  let totalWarnings = 0;
  let totalErrors = 0;

  // Collect all issues
  results.results.forEach((result, index) => {
    const event = events[index];
    
    result.errors.forEach(error => {
      issues.push({
        eventId: event.id || `event_${index}`,
        eventType: result.eventType,
        severity: 'error',
        message: error
      });
      totalErrors++;
    });

    result.warnings.forEach(warning => {
      issues.push({
        eventId: event.id || `event_${index}`,
        eventType: result.eventType,
        severity: 'warning',
        message: warning
      });
      totalWarnings++;
    });
  });

  // Count events by type
  const eventBreakdown: Record<string, number> = {};
  results.results.forEach(result => {
    eventBreakdown[result.eventType] = (eventBreakdown[result.eventType] || 0) + 1;
  });

  return {
    summary: {
      totalEvents: results.totalEvents,
      compliantEvents: results.validEvents,
      complianceRate: results.totalEvents > 0 ? (results.validEvents / results.totalEvents) * 100 : 100,
      criticalErrors: totalErrors,
      warnings: totalWarnings
    },
    eventBreakdown,
    issues
  };
} 
