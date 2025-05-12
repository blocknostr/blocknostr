
import { Relay } from '../types';

/**
 * Interface for NostrService relay management methods
 * Implements proper typing for relay-related operations
 */
export interface NostrServiceRelayMethods {
  publishRelayList(relays: Relay[]): Promise<boolean>;
  getRelaysForUser(pubkey: string): Promise<string[]>;
  getRelayStatus(): Relay[];
  addRelay(relayUrl: string, readWrite?: boolean): Promise<boolean>;
  removeRelay(relayUrl: string): void;
  connectToUserRelays(): Promise<string[]>;
}

/**
 * Interface for NostrService profile-related operations
 */
export interface NostrServiceProfileMethods {
  getUserProfile(pubkey: string): Promise<any>;
  getProfilesByPubkeys(pubkeys: string[]): Promise<Record<string, any>>;
  getAccountCreationDate(pubkey: string): Promise<number | null>;
}
