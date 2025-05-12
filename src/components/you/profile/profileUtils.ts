import { nostrService } from '@/lib/nostr';
import { verifyNip05 as nip05Verify, isValidNip05Format } from '@/lib/nostr/utils/nip/nip05';
import { isValidHexString } from '@/lib/nostr/utils/keys';
import { contentCache } from '@/lib/nostr/cache/content-cache';
import { toast } from 'sonner';

/**
 * Utilities for profile management
 */

/**
 * Verify a NIP-05 identifier for the user
 * @param identifier NIP-05 identifier to verify
 * @returns Promise that resolves to boolean indicating verification status
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier) return false;
  
  // Normalize the identifier to lowercase
  const normalizedIdentifier = identifier.trim().toLowerCase();
  
  try {
    // Verify using the general NIP-05 verification utility
    // Check if result is not null to properly indicate verification status
    const pubkeyHex = await nip05Verify(normalizedIdentifier);
    return pubkeyHex !== null; // Return true if a valid pubkey was returned
  } catch (error) {
    console.error("Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Verify a NIP-05 identifier matches the current user's public key
 * @param identifier NIP-05 identifier to verify
 * @returns Promise that resolves to boolean indicating if the identifier matches the current user
 */
export async function verifyNip05ForCurrentUser(identifier: string): Promise<boolean> {
  if (!identifier || !nostrService.publicKey) return false;
  
  // Normalize the identifier to lowercase
  const normalizedIdentifier = identifier.trim().toLowerCase();
  
  try {
    const pubkeyHex = await nip05Verify(normalizedIdentifier);
    // Validate that pubkeyHex is a valid hex string and matches the current user's pubkey
    return pubkeyHex !== null && 
           isValidHexString(pubkeyHex) && 
           pubkeyHex === nostrService.publicKey;
  } catch (error) {
    console.error("Error verifying NIP-05 for current user:", error);
    return false;
  }
}

/**
 * Force refresh a user's profile data with multiple retries
 * @param pubkey The public key of the profile to refresh
 */
export async function forceRefreshProfile(pubkey: string): Promise<void> {
  if (!pubkey) return;
  
  const maxRetries = 3;
  let retryCount = 0;
  let success = false;
  
  const tryRefresh = async (): Promise<boolean> => {
    try {
      console.log(`Forcing profile refresh for: ${pubkey.substring(0, 8)}...`);
      
      // 1. Clear from cache
      if (contentCache.getProfile(pubkey)) {
        contentCache.cacheProfile(pubkey, null);
      }
      
      // 2. Connect to relays
      await nostrService.connectToUserRelays();
      
      // Add popular relays to increase chances of success
      await nostrService.addMultipleRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social",
        "wss://nostr.fmt.wiz.biz"
      ]);
      
      // 3. Request fresh profile with forced refresh parameter
      // Fix: Remove the second argument as the function only expects one
      const profile = await nostrService.getUserProfile(pubkey);
      
      if (profile) {
        console.log(`Profile refresh completed for: ${pubkey.substring(0, 8)}...`);
        return true;
      } else {
        console.warn(`No profile data returned on refresh for: ${pubkey.substring(0, 8)}...`);
        return false;
      }
    } catch (error) {
      console.error(`Error refreshing profile for ${pubkey}:`, error);
      return false;
    }
  };
  
  // First attempt
  success = await tryRefresh();
  
  // Retry with exponential backoff if needed
  while (!success && retryCount < maxRetries) {
    retryCount++;
    const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
    
    console.log(`Retrying profile refresh (${retryCount}/${maxRetries}) in ${delay}ms`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    success = await tryRefresh();
  }
  
  if (!success) {
    console.error(`Failed to refresh profile after ${maxRetries} attempts`);
    throw new Error(`Failed to refresh profile after ${maxRetries} attempts`);
  }
  
  // Trigger UI update by dispatching event
  const event = new CustomEvent('refetchProfile', { 
    detail: { pubkey }
  });
  window.dispatchEvent(event);
}

/**
 * NIP-05 utilities
 */
export const nip05Utils = {
  /**
   * Format a NIP-05 identifier (trim whitespace, lowercase)
   */
  formatIdentifier: (identifier: string): string => {
    if (!identifier) return '';
    return identifier.trim().toLowerCase();
  },

  /**
   * Check if a string is in valid NIP-05 format
   */
  isValidFormat: (identifier: string): boolean => {
    return isValidNip05Format(identifier);
  }
};

/**
 * Sanitize an image URL to ensure it's valid
 * @param url URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  
  try {
    // Basic validation - must start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    // Try to create a URL object to validate
    new URL(url);
    return url;
  } catch (error) {
    console.error("Invalid image URL:", error);
    return '';
  }
}
