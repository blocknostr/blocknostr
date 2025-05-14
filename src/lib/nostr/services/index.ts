
import { SimplePool, Filter } from 'nostr-tools';
import { EventManager } from '../event';

/**
 * Create a subscription to events matching the given filters
 */
export function subscribeToEvents(
  pool: SimplePool,
  filters: Filter[],
  relays: string[],
  callbacks: {
    onevent: (event: any) => void;
    onclose: () => void;
  }
): { sub: string, unsubscribe: () => void } {
  try {
    // Create a unique subscription ID
    const subId = 'subscription-' + Math.random().toString(36).substring(2, 10);
    
    // Subscribe to events using the correct signature for nostr-tools
    const subscription = pool.subscribeMany(
      relays,
      filters,
      {
        onevent: callbacks.onevent,
        onclose: callbacks.onclose
      }
    );
    
    // Return the subscription ID and unsubscribe function
    return {
      sub: subId,
      unsubscribe: () => subscription.close()
    };
  } catch (error) {
    console.error('Error subscribing to events:', error);
    return {
      sub: '',
      unsubscribe: () => {}
    };
  }
}

// Create an instance of the EventManager class for service methods
const localEventManager = new EventManager();

/**
 * Get a single event by ID
 */
export function getEventById(eventId: string, relays: string[]): Promise<any | null> {
  return localEventManager.getEventById(eventId, relays);
}

/**
 * Get events matching the given filters
 */
export function getEvents(filters: Filter[], relays: string[]): Promise<any[]> {
  return localEventManager.getEvents(filters, relays);
}

/**
 * Get user profiles for the given public keys
 */
export function getProfilesByPubkeys(pubkeys: string[], relays: string[]): Promise<Record<string, any>> {
  return localEventManager.getProfilesByPubkeys(pubkeys, relays);
}

/**
 * Get a user profile by public key
 */
export function getUserProfile(pubkey: string, relays: string[]): Promise<Record<string, any> | null> {
  return localEventManager.getUserProfile(pubkey, relays);
}

/**
 * Verify a NIP-05 identifier
 */
export function verifyNip05(pubkey: string, nip05Identifier: string): Promise<boolean> {
  return localEventManager.verifyNip05(pubkey, nip05Identifier);
}
