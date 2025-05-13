
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

// NIP-65 relay list parsing
export const parseRelayList = (event?: NostrEvent): string[] => {
  if (!event || event.kind !== 10002) return [];
  
  const relayUrls: string[] = [];
  
  try {
    for (const tag of event.tags) {
      if (Array.isArray(tag) && tag[0] === 'r' && tag.length >= 2) {
        const url = tag[1];
        // Basic validation that it looks like a relay URL
        if (typeof url === 'string' && (url.startsWith('wss://') || url.startsWith('ws://'))) {
          relayUrls.push(url);
        }
      }
    }
  } catch (error) {
    console.error('Error parsing relay list:', error);
  }
  
  return relayUrls;
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

// Export validator
export { validateEvent as validator };
