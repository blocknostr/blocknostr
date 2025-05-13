
import { NostrEvent } from '../../types';

// NIP-01 event validation
export const validateEvent = (event: NostrEvent) => {
  const results: Record<string, { valid: boolean; errors: string[] }> = {
    'NIP-01': { valid: true, errors: [] },
    'NIP-10': { valid: true, errors: [] },
    'NIP-25': { valid: true, errors: [] }
  };
  
  // Basic validation for required fields
  if (!event.id) {
    results['NIP-01'].valid = false;
    results['NIP-01'].errors.push('Missing id');
  }
  
  if (!event.pubkey) {
    results['NIP-01'].valid = false;
    results['NIP-01'].errors.push('Missing pubkey');
  }
  
  if (event.created_at === undefined) {
    results['NIP-01'].valid = false;
    results['NIP-01'].errors.push('Missing created_at');
  }
  
  if (!event.sig) {
    results['NIP-01'].valid = false;
    results['NIP-01'].errors.push('Missing sig');
  }
  
  // Return all validation results
  return results;
};

// NIP-65 relay list parsing - updated to return Map
export const parseRelayList = (event?: NostrEvent): Map<string, { read: boolean, write: boolean }> => {
  const relayMap = new Map<string, { read: boolean, write: boolean }>();
  
  if (!event || event.kind !== 10002) return relayMap;
  
  try {
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
        const url = tag[1];
        // Basic validation that it looks like a relay URL
        if (typeof url === 'string' && (url.startsWith('wss://') || url.startsWith('ws://'))) {
          const read = tag.length >= 3 ? tag[2] === 'read' || tag[2] === 'read+write' : true;
          const write = tag.length >= 3 ? tag[2] === 'write' || tag[2] === 'read+write' : true;
          
          relayMap.set(url, { read, write });
        }
      }
    }
  } catch (error) {
    console.error('Error parsing relay list:', error);
  }
  
  return relayMap;
};

// Function to extract just relay URLs for compatibility with existing code
export const getRelayUrls = (relayMap: Map<string, any>): string[] => {
  return Array.from(relayMap.keys());
};

// NIP-36 content warnings
export const hasContentWarning = (event: NostrEvent): boolean => {
  return event.tags?.some(tag => 
    Array.isArray(tag) && tag[0] === 'content-warning'
  ) || false;
};

export const getContentWarningReasons = (event: NostrEvent): string[] => {
  const reasons: string[] = [];
  
  event.tags?.forEach(tag => {
    if (Array.isArray(tag) && tag[0] === 'content-warning' && tag.length >= 2) {
      reasons.push(tag[1]);
    }
  });
  
  return reasons;
};

export const addContentWarning = (event: NostrEvent, warningType: string): NostrEvent => {
  const updatedEvent = { ...event };
  
  if (!updatedEvent.tags) {
    updatedEvent.tags = [];
  }
  
  updatedEvent.tags.push(['content-warning', warningType]);
  
  return updatedEvent;
};

// NIP-01: Basic validation functions
export const validateNip01Event = (event: any): { valid: boolean; errors: string[] } => {
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
  }
  
  if (typeof event.content !== 'string') {
    errors.push('content must be a string');
  }
  
  if (!event.sig) {
    errors.push('Missing sig field');
  }
  
  return { valid: errors.length === 0, errors };
};

// NIP-10: Thread handling
export const validateNip10Tags = (tags: string[][]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(tags)) {
    return { valid: false, errors: ['tags must be an array'] };
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  for (let i = 0; i < eTags.length; i++) {
    const tag = eTags[i];
    
    if (tag.length < 2) {
      errors.push(`E-tag at index ${i} must have an event ID`);
      continue;
    }
    
    if (!/^[0-9a-fA-F]{64}$/.test(tag[1])) {
      errors.push(`E-tag at index ${i} has an invalid event ID format`);
    }
    
    if (tag.length >= 4 && tag[3] && !['root', 'reply', 'mention'].includes(tag[3])) {
      errors.push(`E-tag at index ${i} has an invalid marker: ${tag[3]}`);
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const parseThreadTags = (tags: string[][]): {
  rootId: string | null;
  replyId: string | null;
  mentions: string[];
} => {
  const result = {
    rootId: null as string | null,
    replyId: null as string | null,
    mentions: [] as string[]
  };
  
  if (!tags || !Array.isArray(tags)) {
    return result;
  }
  
  const eTags = tags.filter(tag => Array.isArray(tag) && tag[0] === 'e');
  
  eTags.forEach((tag) => {
    if (tag.length < 2) return;
    
    const [_, eventId, , marker] = tag;
    
    if (marker === "root") {
      result.rootId = eventId;
    } else if (marker === "reply") {
      result.replyId = eventId;
    } else if (!marker) {
      if (!result.replyId) {
        result.replyId = eventId;
      } else {
        result.mentions.push(eventId);
      }
    } else {
      result.mentions.push(eventId);
    }
  });
  
  if (!result.rootId && result.replyId) {
    result.rootId = result.replyId;
  }
  
  return result;
};

// NIP-25: Reactions
export const validateNip25Reaction = (event: NostrEvent): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (event.kind !== 7) {
    errors.push('Reaction event must have kind 7');
    return { valid: false, errors };
  }
  
  const eTags = event.tags.filter(tag => tag[0] === 'e');
  if (eTags.length === 0) {
    errors.push('Reaction must reference an event with e-tag');
  }
  
  const pTags = event.tags.filter(tag => tag[0] === 'p');
  if (pTags.length === 0) {
    errors.push('Reaction should reference the author of the event with p-tag');
  }
  
  return { valid: errors.length === 0, errors };
};

// NIP-36: Content warnings
export const validateNip36ContentWarning = (event: NostrEvent): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const cwTags = event.tags.filter(tag => tag[0] === 'content-warning');
  if (cwTags.length > 0) {
    const validReasons = ["nudity", "sexual", "porn", "gore", "self-harm", "violence", "graphic", "nsfw"];
    
    for (const tag of cwTags) {
      if (tag.length > 1 && tag[1] && !validReasons.includes(tag[1].toLowerCase()) && !tag[1].startsWith('custom:')) {
        errors.push(`Content warning reason '${tag[1]}' is not standard.`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
};

// NIP-05: Identifier verification
export const isValidNip05Format = (identifier: string): boolean => {
  return /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(identifier);
};

export const verifyNip05 = async (identifier: string, pubkey: string): Promise<boolean> => {
  if (!isValidNip05Format(identifier)) {
    return false;
  }
  
  try {
    const [name, domain] = identifier.split('@');
    const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    if (!data.names || !data.names[name]) {
      return false;
    }
    
    return data.names[name] === pubkey;
  } catch (error) {
    console.error('Error verifying NIP-05 identifier:', error);
    return false;
  }
};

// NIP-44: Encryption functions (placeholder implementations)
export const encrypt = ({ plaintext, privateKey, publicKey }: { 
  plaintext: string; 
  privateKey: string; 
  publicKey: string; 
}): string => {
  // Placeholder implementation
  return `encrypted:${plaintext}`;
};

export const decrypt = ({ ciphertext, privateKey, publicKey }: { 
  ciphertext: string; 
  privateKey: string; 
  publicKey: string; 
}): string => {
  // Placeholder implementation
  if (ciphertext.startsWith('encrypted:')) {
    return ciphertext.substring(10);
  }
  return '';
};

// NIP-01: Account creation date
export const getAccountCreationDate = (events: NostrEvent[]): Date | null => {
  if (!events || events.length === 0) return null;
  
  const metadataEvents = events.filter(event => event.kind === 0);
  if (metadataEvents.length === 0) return null;
  
  const sortedEvents = [...metadataEvents].sort((a, b) => a.created_at - b.created_at);
  
  return sortedEvents[0] ? new Date(sortedEvents[0].created_at * 1000) : null;
};

// Export validator
export { validateEvent as validator };
