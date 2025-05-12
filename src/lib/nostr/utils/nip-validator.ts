
/**
 * Utility functions to validate and test NIP implementations
 * Used for both verification and unit testing
 */

import { NostrEvent } from "../types";

/**
 * NIP-01: Validates basic event structure according to the NIP-01 spec
 * https://github.com/nostr-protocol/nips/blob/master/01.md
 */
export function validateNip01Event(event: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required fields
  if (!event) {
    return { valid: false, errors: ['Event is undefined or null'] };
  }
  
  if (!event.id) {
    errors.push('Missing id field');
  }
  
  if (!event.pubkey) {
    errors.push('Missing pubkey field');
  }
  
  if (!event.created_at) {
    errors.push('Missing created_at field');
  } else if (typeof event.created_at !== 'number') {
    errors.push('created_at must be a number (UNIX timestamp)');
  }
  
  if (event.kind === undefined) {
    errors.push('Missing kind field');
  } else if (typeof event.kind !== 'number') {
    errors.push('kind must be a number');
  }
  
  if (!Array.isArray(event.tags)) {
    errors.push('tags must be an array');
  } else {
    // Validate tag structure: each tag must be an array of strings
    for (let i = 0; i < event.tags.length; i++) {
      const tag = event.tags[i];
      if (!Array.isArray(tag)) {
        errors.push(`Tag at index ${i} must be an array`);
      } else {
        for (let j = 0; j < tag.length; j++) {
          if (typeof tag[j] !== 'string') {
            errors.push(`Tag element at index ${i},${j} must be a string`);
          }
        }
      }
    }
  }
  
  if (typeof event.content !== 'string') {
    errors.push('content must be a string');
  }
  
  if (!event.sig) {
    errors.push('Missing sig field');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * NIP-05: Tests if a string conforms to the NIP-05 identifier format
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */
export function isValidNip05Format(nip05: string): boolean {
  if (!nip05) return false;
  
  // NIP-05 format is user@domain.tld
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(nip05);
}

/**
 * NIP-10: Validates that e-tags follow the proper structure according to NIP-10
 * https://github.com/nostr-protocol/nips/blob/master/10.md
 */
export function validateNip10Tags(tags: string[][]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(tags)) {
    return { valid: false, errors: ['tags must be an array'] };
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  for (let i = 0; i < eTags.length; i++) {
    const tag = eTags[i];
    
    // Validate tag structure ["e", <event-id>, <relay-url>?, <marker>?]
    if (tag.length < 2) {
      errors.push(`E-tag at index ${i} must have an event ID`);
      continue;
    }
    
    // Validate event ID format (hex string of 64 chars)
    if (!/^[0-9a-fA-F]{64}$/.test(tag[1])) {
      errors.push(`E-tag at index ${i} has an invalid event ID format`);
    }
    
    // If marker is present, validate it's one of the allowed values
    if (tag.length >= 4 && tag[3]) {
      const marker = tag[3];
      if (!['root', 'reply', 'mention'].includes(marker)) {
        errors.push(`E-tag at index ${i} has an invalid marker: ${marker}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * NIP-25: Validates reaction event according to NIP-25 spec
 * https://github.com/nostr-protocol/nips/blob/master/25.md
 */
export function validateNip25Reaction(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Reaction must be kind 7
  if (event.kind !== 7) {
    errors.push('Reaction event must have kind 7');
  }
  
  // Must have at least one e tag (referenced event)
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  if (eTags.length === 0) {
    errors.push('Reaction must have at least one e tag referencing the event being reacted to');
  }
  
  // Must have at least one p tag (author of referenced event)
  const pTags = event.tags.filter(tag => tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push('Reaction must have at least one p tag referencing the author of the event');
  }
  
  // Content should be a single emoji or + for like (commonly used)
  // This is a loose validation since NIP-25 allows other content too
  if (event.content !== '' && event.content !== '+' && !/^\p{Emoji}$/u.test(event.content)) {
    // Not an error, but a warning
    console.warn('Reaction content is not a single emoji or +');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * NIP-39: Validates external identity verification claim according to NIP-39
 * https://github.com/nostr-protocol/nips/blob/master/39.md
 */
export function validateNip39Claim(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Must be kind 0 (metadata)
  if (event.kind !== 0) {
    errors.push('External identity claim must be in a kind 0 event');
    return { valid: false, errors };
  }
  
  // Look for 'i' tags with proper structure
  const iTags = event.tags.filter(tag => tag[0] === 'i');
  
  if (iTags.length === 0) {
    errors.push('No external identity claims (i tags) found');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < iTags.length; i++) {
    const iTag = iTags[i];
    
    // Tag format should be ['i', '<platform>:<identity>', '<proof>', '<additional-url>?']
    if (iTag.length < 3) {
      errors.push(`Identity tag at index ${i} must have at least a platform:identifier and proof`);
      continue;
    }
    
    // Check platform:identity format
    const platformIdentity = iTag[1];
    if (!platformIdentity.includes(':')) {
      errors.push(`Identity tag at index ${i} has invalid format - must be platform:identifier`);
      continue;
    }
    
    // For Twitter/X claims, verify if the format follows 'twitter:username'
    const [platform, identifier] = platformIdentity.split(':');
    if (platform === 'twitter' && (!identifier || identifier.trim() === '')) {
      errors.push(`Twitter identity tag at index ${i} has invalid username`);
    }
    
    // Proof should be a tweet ID or URL
    const proof = iTag[2];
    if (!proof || proof.trim() === '') {
      errors.push(`Identity tag at index ${i} has invalid proof`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * NIP-65: Validates relay list metadata according to NIP-65
 * https://github.com/nostr-protocol/nips/blob/master/65.md
 */
export function validateNip65RelayList(event: NostrEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic event validation
  const baseValidation = validateNip01Event(event);
  if (!baseValidation.valid) {
    return baseValidation;
  }
  
  // Must be kind 10002
  if (event.kind !== 10002) {
    errors.push('Relay list event must be kind 10002');
    return { valid: false, errors };
  }
  
  // Must have at least one r tag
  const rTags = event.tags.filter(tag => tag[0] === 'r');
  if (rTags.length === 0) {
    errors.push('Relay list must have at least one r tag');
    return { valid: false, errors };
  }
  
  for (let i = 0; i < rTags.length; i++) {
    const rTag = rTags[i];
    
    // Tag format should be ['r', '<relay-url>', 'read'?, 'write'?]
    if (rTag.length < 2) {
      errors.push(`Relay tag at index ${i} must have a URL`);
      continue;
    }
    
    // Validate relay URL format
    const relayUrl = rTag[1];
    try {
      const url = new URL(relayUrl);
      if (!['ws:', 'wss:'].includes(url.protocol)) {
        errors.push(`Relay tag at index ${i} has invalid protocol: ${url.protocol}, must be ws: or wss:`);
      }
    } catch (error) {
      errors.push(`Relay tag at index ${i} has invalid URL format: ${relayUrl}`);
      continue;
    }
    
    // Validate read/write markers if present
    if (rTag.length > 2) {
      const markers = rTag.slice(2);
      
      for (const marker of markers) {
        if (marker !== 'read' && marker !== 'write') {
          errors.push(`Relay tag at index ${i} has invalid marker: ${marker}, must be 'read' or 'write'`);
        }
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Comprehensive testing function to test NIP implementations on the current event
 */
export function testNipImplementations(event: NostrEvent): Record<string, {valid: boolean, errors: string[]}> {
  return {
    'NIP-01': validateNip01Event(event),
    'NIP-10': validateNip10Tags(event.tags),
    'NIP-25': event.kind === 7 ? validateNip25Reaction(event) : { valid: true, errors: ['Not a reaction event'] },
    'NIP-39': event.kind === 0 ? validateNip39Claim(event) : { valid: true, errors: ['Not a metadata event'] },
    'NIP-65': event.kind === 10002 ? validateNip65RelayList(event) : { valid: true, errors: ['Not a relay list event'] }
  };
}
