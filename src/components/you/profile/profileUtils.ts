
import { nostrService } from '@/lib/nostr';
import { contentCache } from '@/lib/nostr';
import { toast } from 'sonner';

/**
 * Verify a NIP-05 identifier for the current user
 */
export async function verifyNip05ForCurrentUser(identifier: string): Promise<boolean> {
  if (!identifier) return false;
  
  try {
    const pubkey = nostrService.publicKey;
    if (!pubkey) return false;
    
    return await verifyNip05Identifier(identifier, pubkey);
  } catch (error) {
    console.error("Error verifying NIP-05 for current user:", error);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier against a given pubkey
 */
export async function verifyNip05Identifier(identifier: string, pubkey?: string): Promise<boolean> {
  if (!identifier) return false;
  
  try {
    // If no pubkey is provided, use the current user's pubkey
    const keyToVerify = pubkey || nostrService.publicKey;
    if (!keyToVerify) return false;
    
    // Use the adapter to verify the NIP-05 identifier
    const isValid = await nostrService.verifyNip05(identifier, keyToVerify);
    return isValid;
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Force a refresh of a profile in the cache
 */
export async function forceRefreshProfile(pubkey: string): Promise<void> {
  try {
    // Instead of removing the profile directly (which isn't supported),
    // we'll fetch a fresh profile and override the cache with the forceRefresh flag
    
    // Check if we have active relays before trying to fetch
    const relayStatus = nostrService.getRelayStatus();
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    
    if (connectedRelays.length === 0) {
      console.log("No connected relays. Attempting to connect to default relays...");
      await nostrService.connectToDefaultRelays();
    }
    
    // Fetch fresh profile data
    const freshProfile = await nostrService.getUserProfile(pubkey);
    
    // Force cache update with new data if we got a profile back
    if (freshProfile) {
      // Use the existing cacheProfile method with forceRefresh = true
      contentCache.cacheProfile(pubkey, freshProfile, true);
      console.log("Profile refreshed and cached:", freshProfile.name || freshProfile.display_name || pubkey);
      return;
    }
    
    console.log("No profile data returned for refresh");
  } catch (error) {
    console.error("Error forcing profile refresh:", error);
    throw error;
  }
}

// NIP-05 utility functions
export const nip05Utils = {
  /**
   * Convert a pubkey to a NIP-05 identifier format (not verification)
   */
  pubkeyToIdentifier(pubkey: string, domain: string = "example.com"): string {
    if (!pubkey) return "";
    
    // Take first 8 chars of pubkey as username
    const username = pubkey.substring(0, 8).toLowerCase();
    return `${username}@${domain}`;
  },
  
  /**
   * Extract name and domain parts from a NIP-05 identifier
   */
  parseIdentifier(identifier: string): { name: string; domain: string } | null {
    if (!identifier) return null;
    
    const parts = identifier.split('@');
    if (parts.length !== 2) return null;
    
    return {
      name: parts[0],
      domain: parts[1]
    };
  }
};
