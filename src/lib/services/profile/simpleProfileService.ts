
import { nostrService } from "@/lib/nostr";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Simple service for fetching profile metadata
 */
class SimpleProfileService {
  /**
   * Get metadata for a profile with optimized caching
   */
  async getProfileMetadata(pubkeyOrNpub: string): Promise<any> {
    if (!pubkeyOrNpub) {
      throw new Error("No pubkey or npub provided");
    }
    
    let hexPubkey: string;
    
    // Convert npub to hex if needed
    if (pubkeyOrNpub.startsWith('npub')) {
      try {
        hexPubkey = nostrService.getHexFromNpub(pubkeyOrNpub);
      } catch (error) {
        console.error("Invalid npub:", error);
        throw new Error("Invalid npub format");
      }
    } else {
      hexPubkey = pubkeyOrNpub;
    }
    
    // Check cache first
    const cacheKey = `profile:${hexPubkey}`;
    const cachedProfile = cacheManager.get(cacheKey);
    
    if (cachedProfile) {
      console.log(`[simpleProfileService] Cache hit for ${hexPubkey.substring(0, 8)}`);
      return cachedProfile;
    }
    
    console.log(`[simpleProfileService] Fetching profile for ${hexPubkey.substring(0, 8)}`);
    
    // Make sure we're connected to relays
    await nostrService.connectToUserRelays();
    
    // Fetch profile
    const profile = await nostrService.getUserProfile(hexPubkey);
    
    if (profile) {
      // Cache profile for 5 minutes
      cacheManager.set(cacheKey, profile, 5 * 60 * 1000);
    }
    
    return profile;
  }
}

export const simpleProfileService = new SimpleProfileService();
