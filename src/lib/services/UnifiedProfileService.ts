import { nostrService } from "@/lib/nostr";
import { eventBus, EVENTS } from "./EventBus";
import { cacheManager } from "@/lib/utils/cacheManager";
import type { NostrProfileMetadata } from '@/lib/nostr'; // Import base type

// Define a new type that includes pubkey
export interface CachedUserProfile extends NostrProfileMetadata {
  pubkey: string;
  follows?: string[]; // Add optional follows property
}

/**
 * Central unified profile service that handles fetching, caching and distribution of profile data
 */
class UnifiedProfileService {
  private profileCache: Map<string, CachedUserProfile> = new Map();
  private fetchingProfiles: Set<string> = new Set();
  private prefetchQueue: string[] = []; // Changed from Set to array
  private retryQueue: Map<string, { attempts: number, lastTry: number }> = new Map();
  private maxRetryAttempts = 3;
  private retryDelay = 5000; // 5 seconds

  // Add debouncing for profile update events
  private profileUpdateTimers: Map<string, number> = new Map();
  private updateDebounceMs = 500; // 500ms debounce for updates

  constructor() {
    // Start the retry processor
    this.startRetryProcessor();
  }

  /**
   * Get profile data with unified caching strategy
   */
  async getProfile(pubkey: string, options: { force?: boolean } = {}): Promise<CachedUserProfile | null> {
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
    const cachedProfile = cacheManager.get(`profile:${pubkey}`) as CachedUserProfile | undefined;
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
      const metadata = await nostrService.getUserProfile(pubkey); // metadata is the content of kind 0

      if (metadata) {
        console.log(`[UnifiedProfileService] Profile fetched successfully for ${pubkey.substring(0, 8)}`,
          metadata.name || metadata.display_name || 'No name');

        const profileWithPubkey: CachedUserProfile = { ...metadata, pubkey: pubkey }; // Add pubkey to the object

        // Update cache
        this.profileCache.set(pubkey, profileWithPubkey);
        cacheManager.set(`profile:${pubkey}`, profileWithPubkey, 5 * 60 * 1000); // 5 minutes

        // Remove from retry queue if it was there
        this.retryQueue.delete(pubkey);

        // Emit event for listeners with debouncing
        this.debouncedEmitProfileUpdate(pubkey, profileWithPubkey);

        // Add related profiles to prefetch queue
        this.queueRelatedProfiles(profileWithPubkey);

        return profileWithPubkey;
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
   * Debounce profile update events to prevent UI flickering
   */
  private debouncedEmitProfileUpdate(pubkey: string, profile: CachedUserProfile): void {
    // Clear any existing timer for this pubkey
    if (this.profileUpdateTimers.has(pubkey)) {
      window.clearTimeout(this.profileUpdateTimers.get(pubkey));
    }

    // Set new timer
    const timerId = window.setTimeout(() => {
      eventBus.emit(EVENTS.PROFILE_UPDATED, pubkey, profile);
      this.profileUpdateTimers.delete(pubkey);
    }, this.updateDebounceMs);

    this.profileUpdateTimers.set(pubkey, timerId);
  }

  /**
   * Batch fetch multiple profiles at once
   */
  async getProfiles(pubkeys: string[]): Promise<Record<string, CachedUserProfile>> {
    if (!pubkeys.length) return {};

    console.log(`[UnifiedProfileService] Batch fetching ${pubkeys.length} profiles`);

    // Deduplicate pubkeys
    const uniquePubkeys = [...new Set(pubkeys)];

    // Get cached profiles first
    const result: Record<string, CachedUserProfile> = {};
    const uncachedPubkeys: string[] = [];

    uniquePubkeys.forEach(pubkey => {
      if (this.profileCache.has(pubkey)) {
        result[pubkey] = this.profileCache.get(pubkey)!; // Added non-null assertion
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
      const fetchedMetadataMap = await nostrService.getProfilesByPubkeys(uncachedPubkeys); // This returns Record<pubkey, metadata>

      // Update cache with fetched profiles
      Object.entries(fetchedMetadataMap).forEach(([eventPubkey, metadata]) => {
        if (metadata) {
          const profileWithPubkey: CachedUserProfile = { ...metadata, pubkey: eventPubkey }; // Add pubkey

          this.profileCache.set(eventPubkey, profileWithPubkey);
          cacheManager.set(`profile:${eventPubkey}`, profileWithPubkey, 5 * 60 * 1000);
          result[eventPubkey] = profileWithPubkey;

          // Remove from retry queue if it was there
          this.retryQueue.delete(eventPubkey);

          // Emit event for listeners with debouncing
          this.debouncedEmitProfileUpdate(eventPubkey, profileWithPubkey);

          // Queue related profiles for prefetching
          this.queueRelatedProfiles(profileWithPubkey);
        } else {
          // Add to retry queue if we failed to fetch it
          this.addToRetryQueue(eventPubkey);
        }
      });

      // Check for profiles that weren't returned and add them to the retry queue
      uncachedPubkeys.forEach(pubkey => {
        if (!fetchedMetadataMap[pubkey]) {
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

    console.log(`[UnifiedProfileService] Added ${pubkey.substring(0, 8)} to retry queue (attempt ${this.retryQueue.get(pubkey)?.attempts || 1}/${this.maxRetryAttempts})`);
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
   * Queue related profiles (follows, etc.) for prefetching
   * @param profile The profile object, potentially containing follow lists
   */
  private queueRelatedProfiles(profile: CachedUserProfile): void {
    // Example: if profile has a 'follows' array of pubkeys
    // This part is highly dependent on your actual profile structure
    // For now, this is a placeholder
    const follows = profile.follows; // Use direct access
    if (Array.isArray(follows)) {
      follows.forEach((relatedPubkey: string) => {
        // Only queue if not already cached or being fetched
        if (!this.profileCache.has(relatedPubkey) && !this.fetchingProfiles.has(relatedPubkey)) {
          this.prefetchQueue.push(relatedPubkey);
        }
      });
    }

    // Process prefetch queue if not too many
    if (this.prefetchQueue.length <= 10) {
      this.processPrefetchQueue();
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
   * Subscribe to profile updates for a specific pubkey
   */
  subscribeToUpdates(pubkey: string, callback: (profile: CachedUserProfile | null) => void): () => void {
    const handler = (updatedPubkey: string, profile: CachedUserProfile) => {
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

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clear all update timers
    this.profileUpdateTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    this.profileUpdateTimers.clear();
  }
}

export const unifiedProfileService = new UnifiedProfileService();
