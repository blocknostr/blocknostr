import { nostrService } from "@/lib/nostr";
import { eventBus, EVENTS } from "./EventBus";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Central unified profile service that handles fetching, caching and distribution of profile data
 */
class UnifiedProfileService {
  private profileCache: Map<string, any> = new Map();
  private fetchingProfiles: Set<string> = new Set();
  // Keep these variables for type compatibility but disable their functionality
  private prefetchQueue: string[] = [];
  private retryQueue: Map<string, { attempts: number, lastTry: number }> = new Map();
  private maxRetryAttempts = 3;
  private retryDelay = 5000; // 5 seconds
  
  constructor() {
    // Disable auto-retry processing
    // this.startRetryProcessor();
  }
  
  /**
   * Get profile data with unified caching strategy
   */
  async getProfile(pubkey: string, options: { force?: boolean } = {}): Promise<any> {
    if (!pubkey) return null;
    
    console.log(`[UnifiedProfileService] getProfile requested for ${pubkey.substring(0, 8)}...`);
    
    // Check cache first (if not forcing refresh)
    if (!options.force && this.profileCache.has(pubkey)) {
      console.log(`[UnifiedProfileService] Profile cache hit for ${pubkey.substring(0, 8)}...`);
      return this.profileCache.get(pubkey);
    }
    
    // Check if already fetching this profile
    if (this.fetchingProfiles.has(pubkey)) {
      console.log(`[UnifiedProfileService] Already fetching profile ${pubkey.substring(0, 8)}...`);
      return null; // Return null and let the subscription system handle updates
    }
    
    // Cache check with cache manager
    const cachedProfile = cacheManager.get(`profile:${pubkey}`);
    if (!options.force && cachedProfile) {
      console.log(`[UnifiedProfileService] CacheManager hit for ${pubkey.substring(0, 8)}...`);
      this.profileCache.set(pubkey, cachedProfile);
      return cachedProfile;
    }
    
    // Mark as fetching
    this.fetchingProfiles.add(pubkey);
    
    try {
      // Fetch from network
      console.log(`[UnifiedProfileService] Fetching profile for ${pubkey.substring(0, 8)}...`);
      const profile = await nostrService.getUserProfile(pubkey);
      
      if (profile) {
        console.log(`[UnifiedProfileService] Profile fetched successfully for ${pubkey.substring(0, 8)}`, 
          profile.name || profile.display_name || 'No name');
        
        // Update cache
        this.profileCache.set(pubkey, profile);
        cacheManager.set(`profile:${pubkey}`, profile, 5 * 60 * 1000); // 5 minutes
        
        // Removed retry queue logic
        
        // Emit event for listeners
        eventBus.emit(EVENTS.PROFILE_UPDATED, pubkey, profile);
        
        // Removed related profiles prefetching
        
        return profile;
      } else {
        console.log(`[UnifiedProfileService] No profile found for ${pubkey.substring(0, 8)}`);
        // Removed retry queue logic
        return null;
      }
    } catch (error) {
      console.error(`[UnifiedProfileService] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      // Removed retry queue logic
      return null;
    } finally {
      // No longer fetching
      this.fetchingProfiles.delete(pubkey);
    }
  }
  
  /**
   * Batch fetch multiple profiles at once
   */
  async getProfiles(pubkeys: string[]): Promise<Record<string, any>> {
    if (!pubkeys.length) return {};
    
    console.log(`[UnifiedProfileService] Batch fetching ${pubkeys.length} profiles`);
    
    // Deduplicate pubkeys
    const uniquePubkeys = [...new Set(pubkeys)];
    
    // Get cached profiles first
    const result: Record<string, any> = {};
    const uncachedPubkeys: string[] = [];
    
    uniquePubkeys.forEach(pubkey => {
      if (this.profileCache.has(pubkey)) {
        result[pubkey] = this.profileCache.get(pubkey);
      } else {
        uncachedPubkeys.push(pubkey);
      }
    });
    
    // If all profiles were cached, return immediately
    if (uncachedPubkeys.length === 0) {
      return result;
    }
    
    console.log(`[UnifiedProfileService] Need to fetch ${uncachedPubkeys.length} uncached profiles`);
    
    try {
      // Fetch remaining profiles
      const fetchedProfiles = await nostrService.getProfilesByPubkeys(uncachedPubkeys);
      
      // Update cache with fetched profiles
      Object.entries(fetchedProfiles).forEach(([pubkey, profile]) => {
        if (profile) {
          this.profileCache.set(pubkey, profile);
          cacheManager.set(`profile:${pubkey}`, profile, 5 * 60 * 1000);
          result[pubkey] = profile;
          
          // Removed retry queue logic
          
          // Emit event for listeners
          eventBus.emit(EVENTS.PROFILE_UPDATED, pubkey, profile);
          
          // Removed related profiles prefetching
        }
      });
      
      return result;
    } catch (error) {
      console.error("[UnifiedProfileService] Error batch fetching profiles:", error);
      return result;
    }
  }
  
  /**
   * Add a pubkey to the retry queue - disabled, but kept for type compatibility
   */
  private addToRetryQueue(pubkey: string): void {
    // Retry queue functionality disabled
    return;
  }
  
  /**
   * Start the retry processor - disabled
   */
  private startRetryProcessor(): void {
    // Retry processor disabled
    return;
  }
  
  /**
   * Process the retry queue - disabled
   */
  private processRetryQueue(): void {
    // Retry queue processing disabled
    return;
  }
  
  /**
   * Queue related profiles for prefetching - disabled
   */
  private queueRelatedProfiles(profile: any): void {
    // Prefetching disabled
    return;
  }
  
  /**
   * Process the prefetch queue in the background - disabled
   */
  private processPrefetchQueue(): void {
    // Prefetching disabled
    return;
  }
  
  /**
   * Subscribe to profile updates
   */
  subscribeToUpdates(pubkey: string, callback: (profile: any) => void): () => void {
    const handler = (updatedPubkey: string, profile: any) => {
      if (updatedPubkey === pubkey) {
        callback(profile);
      }
    };
    
    eventBus.on(EVENTS.PROFILE_UPDATED, handler);
    
    // Return unsubscribe function
    return () => {
      eventBus.off(EVENTS.PROFILE_UPDATED, handler);
    };
  }
}

export const unifiedProfileService = new UnifiedProfileService();
