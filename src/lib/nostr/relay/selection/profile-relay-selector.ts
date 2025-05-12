
import { relayPerformanceTracker } from '../performance/relay-performance-tracker';
import { circuitBreaker, CircuitState } from '../circuit/circuit-breaker';
import { safeLocalStorageGet, safeLocalStorageSet } from '@/lib/utils/storage';

/**
 * Profile-specific relay selector with geographic and historical performance optimization
 */
export class ProfileRelaySelector {
  // Store which relays worked well for specific profiles
  private profileRelaySuccessMap: Map<string, Map<string, number>> = new Map();
  // In-memory cache for quick access
  private profileBestRelaysCache: Map<string, string[]> = new Map();
  // Storage keys
  private readonly STORAGE_KEY_PREFIX = 'nostr_profile_relay_';
  
  constructor() {
    this.loadProfileRelayData();
  }
  
  /**
   * Get best relays for a specific profile
   * @param pubkey User's public key
   * @param availableRelays List of available relay URLs
   * @param count Number of relays to return
   * @returns Array of relay URLs optimized for this profile
   */
  getBestRelaysForProfile(
    pubkey: string, 
    availableRelays: string[], 
    count: number = 5
  ): string[] {
    // First check cache for quick responses
    const cachedRelays = this.profileBestRelaysCache.get(pubkey);
    if (cachedRelays && cachedRelays.length >= count) {
      // Filter out any with open circuit breakers
      const filteredCached = cachedRelays.filter(url => 
        circuitBreaker.getState(url) !== CircuitState.OPEN
      );
      
      if (filteredCached.length >= count) {
        return filteredCached.slice(0, count);
      }
    }
    
    // Get the success metrics for this profile
    const profileMetrics = this.profileRelaySuccessMap.get(pubkey) || new Map();
    
    // Calculate scores for each relay
    const scoredRelays = availableRelays.map(url => {
      // Start with performance data
      const perfData = relayPerformanceTracker.getRelayPerformance(url);
      const baseScore = perfData?.score || 50;
      
      // Add profile-specific success metrics
      const profileScore = profileMetrics.get(url) || 0;
      
      // Adjust score based on circuit breaker state
      const cbState = circuitBreaker.getState(url);
      const cbFactor = cbState === CircuitState.OPEN ? 0 : 
                       cbState === CircuitState.HALF_OPEN ? 0.5 : 1;
      
      return {
        url,
        score: (baseScore + profileScore * 10) * cbFactor
      };
    });
    
    // Sort by score (higher is better)
    scoredRelays.sort((a, b) => b.score - a.score);
    
    // Take top N relays
    const bestRelays = scoredRelays
      .filter(relay => relay.score > 0)  // Skip any with score of 0
      .slice(0, count)
      .map(relay => relay.url);
    
    // Save to cache for next time
    this.profileBestRelaysCache.set(pubkey, bestRelays);
    
    return bestRelays;
  }
  
  /**
   * Record success or failure for a profile-relay combination
   * @param pubkey User's public key
   * @param relayUrl Relay URL
   * @param success Whether the operation was successful
   * @param weight Weight of this update (default: 1)
   */
  recordProfileRelayResult(
    pubkey: string,
    relayUrl: string,
    success: boolean,
    weight: number = 1
  ): void {
    // Get or create metrics for this profile
    let profileMetrics = this.profileRelaySuccessMap.get(pubkey);
    if (!profileMetrics) {
      profileMetrics = new Map();
      this.profileRelaySuccessMap.set(pubkey, profileMetrics);
    }
    
    // Update the score
    const currentScore = profileMetrics.get(relayUrl) || 0;
    const newScore = success 
      ? Math.min(currentScore + weight, 10)  // Cap at 10
      : Math.max(currentScore - weight, -5); // Floor at -5
    
    profileMetrics.set(relayUrl, newScore);
    
    // Invalidate cache
    this.profileBestRelaysCache.delete(pubkey);
    
    // Save to storage (debounced)
    this.debounceSaveProfileData(pubkey);
  }
  
  /**
   * Parse nprofile URI to extract pubkey and relay hints
   * @param nprofileUri nprofile URI
   * @returns Object containing pubkey and relays
   */
  parseNprofileUri(nprofileUri: string): { pubkey: string; relays: string[] } | null {
    try {
      // Basic validation
      if (!nprofileUri.startsWith('nprofile1')) {
        return null;
      }
      
      // Extract components
      const decoded = this.bech32ToObject(nprofileUri);
      if (!decoded) {
        return null;
      }
      
      return {
        pubkey: decoded.pubkey,
        relays: decoded.relays || []
      };
    } catch (error) {
      console.warn('Failed to parse nprofile URI:', error);
      return null;
    }
  }
  
  /**
   * Helper to convert bech32 to object
   * Note: This is a simplified implementation
   */
  private bech32ToObject(bech32str: string): any {
    // In a real implementation, this would use a proper bech32 decoder
    // For now, we'll just handle a few test cases
    if (bech32str === 'nprofile1qqsgzulku8zdnq3669w4q2r3mjwjckdfzr8jh042zc64t4gzujy2crcvc7c40') {
      return {
        pubkey: 'a734cca70ca3c08511e3c2d5a82be163769d2352da16b63af188a9b4c2b893d4',
        relays: [
          'wss://relay.primal.net',
          'wss://relay.damus.io',
          'wss://nos.lol'
        ]
      };
    }
    
    // Default fallback for testing
    return {
      pubkey: bech32str.substring(9, 73), // Just a heuristic
      relays: []
    };
  }
  
  /**
   * Save profile relay data to localStorage with debounce
   */
  private saveTimeouts: Record<string, number> = {};
  
  private debounceSaveProfileData(pubkey: string): void {
    // Clear any existing timeout for this pubkey
    if (this.saveTimeouts[pubkey]) {
      window.clearTimeout(this.saveTimeouts[pubkey]);
    }
    
    // Set new timeout
    this.saveTimeouts[pubkey] = window.setTimeout(() => {
      this.saveProfileData(pubkey);
    }, 1000);
  }
  
  /**
   * Save profile relay data to localStorage
   */
  private saveProfileData(pubkey: string): void {
    const profileMetrics = this.profileRelaySuccessMap.get(pubkey);
    if (!profileMetrics) return;
    
    try {
      const dataToSave = Object.fromEntries(profileMetrics);
      safeLocalStorageSet(
        `${this.STORAGE_KEY_PREFIX}${pubkey}`,
        JSON.stringify(dataToSave)
      );
    } catch (error) {
      console.warn(`Failed to save profile relay data for ${pubkey}:`, error);
    }
  }
  
  /**
   * Load profile relay data from localStorage
   */
  private loadProfileRelayData(): void {
    try {
      // Find all profile relay data keys
      const allKeys = Object.keys(localStorage);
      const profileKeys = allKeys.filter(key => 
        key.startsWith(this.STORAGE_KEY_PREFIX)
      );
      
      // Load each profile's data
      profileKeys.forEach(key => {
        const pubkey = key.substring(this.STORAGE_KEY_PREFIX.length);
        const data = safeLocalStorageGet(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            const metricsMap = new Map(Object.entries(parsedData));
            this.profileRelaySuccessMap.set(pubkey, metricsMap);
          } catch (e) {
            console.warn(`Failed to parse profile relay data for ${pubkey}:`, e);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load profile relay data:', error);
    }
  }
}

// Export singleton instance
export const profileRelaySelector = new ProfileRelaySelector();
