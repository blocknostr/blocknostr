
import { nostrService } from "@/lib/nostr";
import { eventBus, EVENTS } from "./EventBus";
import { cacheManager } from "@/lib/utils/cacheManager";

/**
 * Central unified profile service that handles fetching, caching and distribution of profile data
 */
class UnifiedProfileService {
  private profileCache: Map<string, any> = new Map();
  private fetchingProfiles: Set<string> = new Set();
  private prefetchQueue: string[] = []; // Changed from Set to array
  private retryQueue: Map<string, { attempts: number, lastTry: number }> = new Map();
  private maxRetryAttempts = 3;
  private retryDelay = 5000; // 5 seconds
  
  constructor() {
    // Start the retry processor
    this.startRetryProcessor();
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
        
        // Remove from retry queue if it was there
        this.retryQueue.delete(pubkey);
        
        // Emit event for listeners
        eventBus.emit(EVENTS.PROFILE_UPDATED, pubkey, profile);
        
        // Add related profiles to prefetch queue
        this.queueRelatedProfiles(profile);
        
        return profile;
      } else {
        console.log(`[UnifiedProfileService] No profile found for ${pubkey.substring(0, 8)}, will queue for retry`);
        this.addToRetryQueue(pubkey);
        return null;
      }
    } catch (error) {
      console.error(`[UnifiedProfileService] Error fetching profile for ${pubkey.substring(0, 8)}:`, error);
      this.addToRetryQueue(pubkey);
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
          
          // Remove from retry queue if it was there
          this.retryQueue.delete(pubkey);
          
          // Emit event for listeners
          eventBus.emit(EVENTS.PROFILE_UPDATED, pubkey, profile);
          
          // Queue related profiles for prefetching
          this.queueRelatedProfiles(profile);
        } else {
          // Add to retry queue if we failed to fetch it
          this.addToRetryQueue(pubkey);
        }
      });
      
      // Check for profiles that weren't returned and add them to the retry queue
      uncachedPubkeys.forEach(pubkey => {
        if (!fetchedProfiles[pubkey]) {
          this.addToRetryQueue(pubkey);
        }
      });
      
      return result;
    } catch (error) {
      console.error("[UnifiedProfileService] Error batch fetching profiles:", error);
      
      // Add all uncached pubkeys to retry queue
      uncachedPubkeys.forEach(pubkey => {
        this.addToRetryQueue(pubkey);
      });
      
      return result;
    }
  }
  
  /**
   * Add a pubkey to the retry queue
   */
  private addToRetryQueue(pubkey: string): void {
    const existing = this.retryQueue.get(pubkey);
    
    if (existing) {
      // Increment attempt count if already in queue
      this.retryQueue.set(pubkey, { 
        attempts: existing.attempts + 1, 
        lastTry: Date.now() 
      });
    } else {
      // Add to queue with first attempt
      this.retryQueue.set(pubkey, { 
        attempts: 1, 
        lastTry: Date.now() 
      });
    }
    
    console.log(`[UnifiedProfileService] Added ${pubkey.substring(0, 8)} to retry queue (attempt ${
      this.retryQueue.get(pubkey)?.attempts || 1}/${this.maxRetryAttempts})`);
  }
  
  /**
   * Start the retry processor
   */
  private startRetryProcessor(): void {
    // Process retry queue every 10 seconds
    setInterval(() => this.processRetryQueue(), 10000);
  }
  
  /**
   * Process the retry queue
   */
  private processRetryQueue(): void {
    if (this.retryQueue.size === 0) return;
    
    console.log(`[UnifiedProfileService] Processing retry queue with ${this.retryQueue.size} items`);
    const now = Date.now();
    const toRetry: string[] = [];
    
    this.retryQueue.forEach((data, pubkey) => {
      // Check if we've exceeded max retry attempts
      if (data.attempts > this.maxRetryAttempts) {
        console.log(`[UnifiedProfileService] Giving up on ${pubkey.substring(0, 8)} after ${data.attempts} attempts`);
        this.retryQueue.delete(pubkey);
        return;
      }
      
      // Check if enough time has passed since last try
      if (now - data.lastTry >= this.retryDelay) {
        toRetry.push(pubkey);
      }
    });
    
    if (toRetry.length > 0) {
      console.log(`[UnifiedProfileService] Retrying ${toRetry.length} profiles`);
      
      // Batch retry up to 5 profiles at once
      if (toRetry.length <= 5) {
        this.getProfiles(toRetry).catch(error => {
          console.error("[UnifiedProfileService] Error in retry batch:", error);
        });
      } else {
        // Process in batches of 5
        for (let i = 0; i < toRetry.length; i += 5) {
          const batch = toRetry.slice(i, i + 5);
          setTimeout(() => {
            this.getProfiles(batch).catch(error => {
              console.error("[UnifiedProfileService] Error in retry batch:", error);
            });
          }, i * 100); // Stagger requests slightly
        }
      }
    }
  }
  
  /**
   * Queue related profiles for prefetching
   */
  private queueRelatedProfiles(profile: any): void {
    if (!profile) return;
    
    // Extract related profiles from following, mentions, etc.
    const relatedPubkeys: string[] = [];
    
    // Extract from mentions
    if (profile.about) {
      const mentionMatches = profile.about.match(/nostr:npub[a-z0-9]{59}/g) || [];
      mentionMatches.forEach((match: string) => {
        try {
          const pubkey = nostrService.getHexFromNpub(match.replace('nostr:', ''));
          if (pubkey) {
            relatedPubkeys.push(pubkey);
          }
        } catch (e) {
          // Ignore invalid npub
        }
      });
    }
    
    // Add up to 5 related profiles to prefetch queue
    const uniquePubkeys = [...new Set(relatedPubkeys)].slice(0, 5);
    
    if (uniquePubkeys.length > 0) {
      console.log(`[UnifiedProfileService] Queuing ${uniquePubkeys.length} related profiles for prefetch`);
      this.prefetchQueue = [...this.prefetchQueue, ...uniquePubkeys];
      
      // Process prefetch queue if not too many
      if (this.prefetchQueue.length <= 10) {
        this.processPrefetchQueue();
      }
    }
  }
  
  /**
   * Process the prefetch queue in the background
   */
  private processPrefetchQueue(): void {
    if (this.prefetchQueue.length === 0) return;
    
    // Take first 3 pubkeys from queue
    const toProcess = this.prefetchQueue.splice(0, 3);
    console.log(`[UnifiedProfileService] Prefetching ${toProcess.length} profiles in background`);
    
    // Prefetch in background with low priority
    setTimeout(() => {
      toProcess.forEach(pubkey => {
        if (!this.profileCache.has(pubkey) && !this.fetchingProfiles.has(pubkey)) {
          this.getProfile(pubkey).catch(err => {
            console.warn(`[UnifiedProfileService] Failed to prefetch profile ${pubkey.substring(0, 8)}`, err);
          });
        }
      });
    }, 1000);
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
