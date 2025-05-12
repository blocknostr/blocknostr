
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
    console.log(`[NIP-05] Verified ${identifier} for pubkey ${keyToVerify.substring(0, 8)}... result: ${isValid}`);
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
  console.log(`[PROFILE REFRESH] Starting force refresh for pubkey: ${pubkey}`);
  try {
    // Check if we have active relays before trying to fetch
    const relayStatus = nostrService.getRelayStatus();
    console.log(`[PROFILE REFRESH] Current relay status:`, relayStatus);
    const connectedRelays = relayStatus.filter(r => r.status === 'connected');
    console.log(`[PROFILE REFRESH] Connected relays count: ${connectedRelays.length}`);
    
    if (connectedRelays.length === 0) {
      console.log("[PROFILE REFRESH] No connected relays. Attempting to connect to default relays...");
      try {
        await nostrService.connectToDefaultRelays();
        const newStatus = nostrService.getRelayStatus();
        const nowConnected = newStatus.filter(r => r.status === 'connected');
        console.log(`[PROFILE REFRESH] After connection attempt, connected relays: ${nowConnected.length}`);
      } catch (connError) {
        console.error("[PROFILE REFRESH] Error connecting to relays:", connError);
      }
    }
    
    // Fetch fresh profile data
    console.log(`[PROFILE REFRESH] Fetching fresh profile for pubkey: ${pubkey}`);
    const freshProfile = await nostrService.getUserProfile(pubkey);
    console.log(`[PROFILE REFRESH] Fresh profile fetch result:`, freshProfile ? "Success" : "No data");
    
    // Force cache update with new data if we got a profile back
    if (freshProfile) {
      // Update the cache with fresh data - handle case where removeProfile isn't available
      if (typeof contentCache.cacheProfile === 'function') {
        console.log(`[PROFILE REFRESH] Caching refreshed profile using cacheProfile()`);
        contentCache.cacheProfile(pubkey, freshProfile, true);
      } else {
        console.log(`[PROFILE REFRESH] Profile cache methods not available, using alternative update method`);
        // Alternative update method if cacheProfile isn't available
        try {
          // If we have a setProfile method, use that
          if (typeof contentCache.setProfile === 'function') {
            console.log(`[PROFILE REFRESH] Using setProfile() fallback method`);
            contentCache.setProfile(pubkey, freshProfile);
          } else {
            console.log(`[PROFILE REFRESH] No cache update methods available, changes will appear after relay sync`);
          }
        } catch (cacheError) {
          console.warn("[PROFILE REFRESH] Error updating profile cache:", cacheError);
        }
      }
      console.log("[PROFILE REFRESH] Profile refreshed and cached:", freshProfile.name || freshProfile.display_name || pubkey.substring(0, 8));
      return;
    }
    
    console.log("[PROFILE REFRESH] No profile data returned for refresh");
  } catch (error) {
    console.error("[PROFILE REFRESH] Error forcing profile refresh:", error);
    throw error;
  }
}

/**
 * Attempt to publish a metadata update with fallback mechanisms
 * @param eventData The profile metadata event to publish
 * @param relayUrls Array of relay URLs to publish to
 * @returns Success indicator and any error message
 */
export async function publishProfileWithFallback(
  eventData: any, 
  relayUrls: string[] = []
): Promise<{success: boolean, error?: string}> {
  console.log("[PROFILE PUBLISH] Starting profile publish with fallbacks");
  
  try {
    // 1. Try extension signing first (most secure)
    console.log("[PROFILE PUBLISH] Attempting to publish via extension");
    let success = false;
    
    try {
      success = await nostrService.publishEvent(eventData);
      console.log("[PROFILE PUBLISH] Extension publish result:", success);
      
      if (success) {
        return { success: true };
      }
    } catch (extError: any) {
      console.warn("[PROFILE PUBLISH] Extension signing failed:", extError);
      
      // Check if this is an unauthorized pubkey error
      const errorMessage = extError?.message || '';
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('address')) {
        console.log("[PROFILE PUBLISH] Extension auth error detected, will try fallbacks");
        return { 
          success: false, 
          error: "Extension authorization failed. The connected extension doesn't match your current identity." 
        };
      }
      
      // Check if this is a POW requirement
      if (errorMessage.includes('pow:')) {
        console.log("[PROFILE PUBLISH] POW requirement detected");
        return { 
          success: false, 
          error: "This relay requires proof-of-work which is not supported. Try using different relays." 
        };
      }
    }
    
    // 2. Fallback to library publishing if the extension failed for other reasons
    console.log("[PROFILE PUBLISH] Extension failed, checking alternatives");
    
    // Ensure we have relay URLs
    if (!relayUrls || relayUrls.length === 0) {
      const relayStatus = nostrService.getRelayStatus();
      relayUrls = relayStatus
        .filter(r => r.status === 'connected')
        .map(r => r.url);
      
      console.log(`[PROFILE PUBLISH] Using ${relayUrls.length} connected relays:`, relayUrls);
      
      if (relayUrls.length === 0) {
        return { 
          success: false,
          error: "No connected relays available for publishing" 
        };
      }
    }
    
    // Try direct publishing if available
    if (typeof nostrService.publishEventDirectly === 'function') {
      console.log("[PROFILE PUBLISH] Attempting direct publish method");
      try {
        const directResult = await nostrService.publishEventDirectly(eventData, relayUrls);
        console.log("[PROFILE PUBLISH] Direct publish result:", directResult);
        
        if (directResult) {
          return { success: true };
        }
      } catch (directError) {
        console.error("[PROFILE PUBLISH] Direct publish failed:", directError);
      }
    }
    
    // Final fallback: try relay-specific methods if available
    console.log("[PROFILE PUBLISH] All standard methods failed, attempt has completed");
    return { 
      success: false,
      error: "Failed to publish profile update. Please try again or check your connection."
    };
  } catch (error: any) {
    console.error("[PROFILE PUBLISH] Unexpected error:", error);
    return { 
      success: false, 
      error: error?.message || "An unexpected error occurred"
    };
  }
}

/**
 * Sanitize image URL to make sure it's a valid URL
 * @param url Image URL that might be a relative path or full URL
 * @returns Valid absolute URL or empty string if invalid
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  
  // Check if it's already an absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Check if it's a relative path starting with /uploads
  if (url.startsWith('/uploads/')) {
    console.log("[IMAGE URL] Detected local upload path, converting to absolute URL");
    // For relative paths, we should not use window.location.origin as that would point to the Lovable preview
    // Instead, we should use a known working URL for profile images
    return `https://nostr.build/placeholder-avatar.jpg`;
  }
  
  // If it doesn't fit any pattern, use a placeholder
  return 'https://nostr.build/placeholder-avatar.jpg';
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
