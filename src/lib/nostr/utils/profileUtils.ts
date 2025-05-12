
import { NostrProfileMetadata } from "../types";
import { contentCache } from "../cache";
import { nostrService } from "../index";

interface ProfileFetchOptions {
  forceRefresh?: boolean;
  cachePriority?: "high" | "normal" | "low";
  includeRelays?: boolean;
}

const DEFAULT_OPTIONS: ProfileFetchOptions = {
  forceRefresh: false,
  cachePriority: "normal",
  includeRelays: false
};

/**
 * A utility for efficient profile data fetching with caching
 */
export const ProfileUtils = {
  /**
   * Fetch profile data with optimized caching strategy
   */
  async fetchProfile(
    pubkey: string, 
    options: ProfileFetchOptions = DEFAULT_OPTIONS
  ): Promise<NostrProfileMetadata | null> {
    if (!pubkey) return null;
    
    const { forceRefresh, cachePriority, includeRelays } = {
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    try {
      // First check cache unless forced refresh
      if (!forceRefresh) {
        const cachedProfile = contentCache.getProfile(pubkey);
        if (cachedProfile) {
          // If including relays, asynchronously fetch and update them
          if (includeRelays && !cachedProfile.relays) {
            this.fetchProfileRelays(pubkey, cachedProfile)
              .catch(error => console.error("Error fetching relays:", error));
          }
          return cachedProfile;
        }
      }
      
      // Connect to relays if needed for fetch
      await nostrService.connectToUserRelays();
      
      // Fetch fresh profile data
      const profile = await nostrService.getUserProfile(pubkey);
      
      // If profile found, cache it
      if (profile) {
        const isImportant = cachePriority === "high";
        contentCache.cacheProfile(pubkey, profile, isImportant);
        
        // Fetch and append relay information if requested
        if (includeRelays) {
          await this.fetchProfileRelays(pubkey, profile);
        }
        
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching profile for ${pubkey}:`, error);
      return null;
    }
  },
  
  /**
   * Fetch and append relay information to a profile
   */
  async fetchProfileRelays(
    pubkey: string, 
    profile: NostrProfileMetadata
  ): Promise<NostrProfileMetadata> {
    try {
      // Try to get relays from NIP-05 first
      if (profile.nip05) {
        const nip05Data = await nostrService.fetchNip05Data(profile.nip05);
        if (nip05Data?.relays) {
          profile.relays = nip05Data.relays;
          return profile;
        }
      }
      
      // Fall back to relays from kind:3 event
      const relays = await nostrService.getRelaysForUser(pubkey);
      if (relays && relays.length > 0) {
        profile.relays = relays.reduce((acc, url) => {
          acc[url] = { read: true, write: true };
          return acc;
        }, {} as Record<string, { read: boolean; write: boolean }>);
      }
      
      return profile;
    } catch (error) {
      console.error(`Error fetching relays for ${pubkey}:`, error);
      return profile;
    }
  },
  
  /**
   * Verify NIP-05 identifier with caching
   */
  async verifyNip05(
    identifier: string, 
    pubkey: string
  ): Promise<boolean> {
    if (!identifier || !pubkey) return false;
    
    try {
      // Check cache first
      const cachedVerification = contentCache.profileCache.getVerification(identifier, pubkey);
      
      if (cachedVerification !== null) {
        return cachedVerification;
      }
      
      // Do the actual verification
      const isVerified = await nostrService.verifyNip05(identifier, pubkey);
      
      // Cache the result
      contentCache.profileCache.cacheVerification(identifier, pubkey, isVerified);
      
      return isVerified;
    } catch (error) {
      console.error(`Error verifying NIP-05 for ${identifier}:`, error);
      return false;
    }
  },
  
  /**
   * Invalidate profile cache and force refresh
   */
  async refreshProfile(pubkey: string): Promise<NostrProfileMetadata | null> {
    contentCache.profileCache.invalidateProfile(pubkey);
    
    return this.fetchProfile(pubkey, {
      forceRefresh: true,
      cachePriority: "high",
      includeRelays: true
    });
  }
};

// Export the utility
export default ProfileUtils;
