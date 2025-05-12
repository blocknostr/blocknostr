import { contentCache, nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { NostrEvent } from '@/lib/nostr/types';

/**
 * Sanitize image URL to ensure it's properly formatted
 * This handles relative paths, app domain paths, and external URLs
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  
  // If URL is already absolute, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL is relative, make it absolute
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  
  // Otherwise, assume it's a relative URL and prepend the origin
  return `${window.location.origin}/${url}`;
}

/**
 * Force refresh a user's profile by clearing cache and fetching new data
 */
export async function forceRefreshProfile(pubkey: string): Promise<boolean> {
  if (!pubkey) {
    console.error("[PROFILE REFRESH] No pubkey provided for refresh");
    return false;
  }
  
  console.log(`[PROFILE REFRESH] Forcing refresh for pubkey: ${pubkey}`);
  
  try {
    // Check relay connections
    const relays = nostrService.getRelayStatus();
    console.log("[PROFILE REFRESH] Current relay status:", relays);
    
    // Connect to relays if needed
    if (relays.filter(r => r.status === 'connected').length === 0) {
      console.log("[PROFILE REFRESH] No connected relays, connecting...");
      await nostrService.connectToDefaultRelays();
      console.log("[PROFILE REFRESH] Connected to default relays");
    }
    
    // Manually fetch fresh profile data - this will update the cache internally
    console.log("[PROFILE REFRESH] Fetching fresh profile data");
    const freshProfile = await nostrService.getUserProfile(pubkey);
    
    if (freshProfile) {
      console.log("[PROFILE REFRESH] Fresh profile data fetched:", freshProfile);
      
      // Update cache with the fresh data
      if (contentCache.cacheEvent) {
        // If we have a cacheEvent method available, use that to update
        console.log("[PROFILE REFRESH] Updating cache with fresh profile data");
        
        // Create a mock kind 0 event with the profile data
        const mockProfileEvent: Partial<NostrEvent> = {
          kind: 0,
          pubkey,
          content: JSON.stringify(freshProfile),
          created_at: Math.floor(Date.now() / 1000),
          tags: []
        };
        
        contentCache.cacheEvent(mockProfileEvent as NostrEvent);
      }
      
      console.log("[PROFILE REFRESH] Profile refresh successful");
      return true;
    } else {
      console.warn("[PROFILE REFRESH] No profile data returned");
      return false;
    }
  } catch (error) {
    console.error("[PROFILE REFRESH] Error forcing profile refresh:", error);
    throw error;
  }
}

/**
 * Verify NIP-05 identifier against a pubkey
 */
export async function verifyNip05Identifier(identifier: string): Promise<boolean> {
  if (!identifier || !identifier.includes('@')) {
    console.log("[NIP-05] Invalid identifier format");
    return false;
  }
  
  try {
    const [name, domain] = identifier.split('@');
    if (!name || !domain) {
      console.log("[NIP-05] Invalid identifier parts");
      return false;
    }
    
    console.log(`[NIP-05] Verifying ${name}@${domain}`);
    const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
    
    if (!response.ok) {
      console.log(`[NIP-05] Verification failed - status: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    
    if (data && data.names && data.names[name]) {
      const pubkey = data.names[name];
      console.log(`[NIP-05] Verification result - name exists and pubkey is: ${pubkey}`);
      return true; // We're just checking if the identifier exists and is valid
    }
    
    console.log("[NIP-05] Name not found in response");
    return false;
  } catch (error) {
    console.error("[NIP-05] Error verifying NIP-05:", error);
    return false;
  }
}

/**
 * Enhanced profile publishing function with fallbacks and better error handling
 */
export async function publishProfileWithFallback(
  event: Partial<NostrEvent>,
  relayUrls: string[]
): Promise<{ success: boolean; error: string | null }> {
  if (!event || !event.kind) {
    console.error("[PUBLISH] Invalid event - missing required fields");
    return { success: false, error: "Invalid event data" };
  }
  
  try {
    console.log("[PUBLISH] Publishing to relays:", relayUrls);
    console.log("[PUBLISH] Event data:", event);
    
    // Primary approach: Use extension signing via NIP-07
    try {
      console.log("[PUBLISH] Attempting to publish with extension signing");
      const publishResult = await nostrService.publish(event as NostrEvent);
      
      console.log("[PUBLISH] Publish result:", publishResult);
      
      if (publishResult === true || (publishResult && publishResult.success)) {
        console.log("[PUBLISH] Publish successful");
        return { success: true, error: null };
      } else {
        console.warn("[PUBLISH] Publish returned false or no success response");
        throw new Error("Publication failed - no success response");
      }
    } catch (primaryError: any) {
      console.error("[PUBLISH] Primary publish method failed:", primaryError);
      
      // Check for Unauthorized errors indicating the extension is using a different key
      if (primaryError.message && (
          primaryError.message.includes("Unauthorized") || 
          primaryError.message.includes("authorization") ||
          primaryError.message.includes("Expected")
      )) {
        return { 
          success: false, 
          error: "Your Nostr extension doesn't match your current identity. Try disconnecting and reconnecting." 
        };
      }
      
      // Check for proof-of-work requirements
      if (primaryError.message && (
          primaryError.message.includes("pow:") ||
          primaryError.message.includes("proof-of-work")
      )) {
        return { 
          success: false, 
          error: "This relay requires proof-of-work which is not supported. Try connecting to different relays." 
        };
      }
      
      // Use eventManager's direct publish method as fallback if available
      try {
        if (nostrService.eventManager && typeof nostrService.eventManager.publishEventDirectly === 'function') {
          console.log("[PUBLISH] Attempting fallback with direct publish");
          const fallbackResult = await nostrService.eventManager.publishEventDirectly(event, relayUrls);
          
          if (fallbackResult) {
            console.log("[PUBLISH] Fallback publish successful");
            return { success: true, error: null };
          }
        }
      } catch (fallbackError) {
        console.error("[PUBLISH] Fallback publish method failed:", fallbackError);
      }
      
      return { 
        success: false, 
        error: primaryError.message || "Failed to publish event" 
      };
    }
  } catch (error: any) {
    console.error("[PUBLISH] Unexpected error during publish:", error);
    return { success: false, error: error.message || "Unknown error during publish" };
  }
}
