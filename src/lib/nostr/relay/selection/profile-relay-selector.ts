/**
 * Profile-specific relay selector
 * Uses past performance data to select best relays for profile data
 */

// In-memory storage for relay performance data
const profileRelayScores: Map<string, Map<string, number>> = new Map();

// Maximum number of relays to track per profile
const MAX_RELAYS_PER_PROFILE = 10;

// Default score for new relays
const DEFAULT_SCORE = 0.5;

// Score adjustment for successful/failed requests
const SUCCESS_BOOST = 0.2;
const FAILURE_PENALTY = 0.3;

// Decay factor for older scores (applied every hour)
const SCORE_DECAY_FACTOR = 0.95;

// Last time decay was applied
let lastDecayTime = Date.now();

export const profileRelaySelector = {
  /**
   * Record result of using a relay for a profile
   * @param profilePubkey Profile public key
   * @param relayUrl Relay URL
   * @param success Whether the request was successful
   */
  recordProfileRelayResult(profilePubkey: string, relayUrl: string, success: boolean) {
    // Apply score decay if needed
    this.applyScoreDecay();
    
    // Get or create score map for this profile
    let relayScores = profileRelayScores.get(profilePubkey);
    if (!relayScores) {
      relayScores = new Map();
      profileRelayScores.set(profilePubkey, relayScores);
    }
    
    // Get current score or use default
    const currentScore = relayScores.get(relayUrl) || DEFAULT_SCORE;
    
    // Update score based on success/failure
    let newScore = currentScore;
    if (success) {
      // Success: boost the score, but cap at 1.0
      newScore = Math.min(1.0, currentScore + SUCCESS_BOOST);
    } else {
      // Failure: reduce the score, but floor at 0.1
      newScore = Math.max(0.1, currentScore - FAILURE_PENALTY);
    }
    
    // Store updated score
    relayScores.set(relayUrl, newScore);
    
    // Trim excess relays if needed
    if (relayScores.size > MAX_RELAYS_PER_PROFILE) {
      // Convert to array for sorting
      const scoreArray = [...relayScores.entries()];
      
      // Sort by score (descending)
      scoreArray.sort((a, b) => b[1] - a[1]);
      
      // Create new map with just the top relays
      const trimmedMap = new Map(scoreArray.slice(0, MAX_RELAYS_PER_PROFILE));
      profileRelayScores.set(profilePubkey, trimmedMap);
    }
  },
  
  /**
   * Apply decay to all scores periodically
   */
  applyScoreDecay() {
    const now = Date.now();
    const hoursPassed = (now - lastDecayTime) / (1000 * 60 * 60);
    
    // Only apply decay if at least an hour has passed
    if (hoursPassed >= 1) {
      // Calculate decay based on hours passed
      const decayFactor = Math.pow(SCORE_DECAY_FACTOR, hoursPassed);
      
      // Apply decay to all scores
      profileRelayScores.forEach((relayScores, profilePubkey) => {
        relayScores.forEach((score, relayUrl) => {
          // Apply decay but don't go below minimum
          const decayedScore = Math.max(0.1, score * decayFactor);
          relayScores.set(relayUrl, decayedScore);
        });
      });
      
      // Update last decay time
      lastDecayTime = now;
    }
  },
  
  /**
   * Get best relays for a profile
   * @param profilePubkey Profile public key
   * @param candidateRelays List of relay URLs to consider
   * @param count Maximum number of relays to return
   * @returns Array of relay URLs sorted by score
   */
  getBestRelaysForProfile(profilePubkey: string, candidateRelays: string[], count: number): string[] {
    // Apply score decay
    this.applyScoreDecay();
    
    // Get scores for this profile
    const relayScores = profileRelayScores.get(profilePubkey);
    
    // Create array to hold [relayUrl, score] pairs
    const scoredRelays: [string, number][] = [];
    
    // Score each candidate relay
    for (const relayUrl of candidateRelays) {
      // Use known score or default
      const score = relayScores?.get(relayUrl) || DEFAULT_SCORE;
      scoredRelays.push([relayUrl, score]);
    }
    
    // Sort by score (highest first)
    scoredRelays.sort((a, b) => b[1] - a[1]);
    
    // Extract just the URLs
    return scoredRelays.slice(0, count).map(([url]) => url);
  },
  
  /**
   * Parse a nostr profile URI to extract pubkey and relay hints
   * @param uri nprofile URI
   * @returns Object with pubkey and relay hints, or null if invalid
   */
  parseNprofileUri(uri: string): { pubkey: string; relays: string[] } | null {
    try {
      // Check if it's an nprofile URI
      if (!uri.startsWith('nprofile1')) {
        return null;
      }
      
      // Implement a basic version of the nprofile parsing
      // In a real implementation, you would use TLV decoding here
      // This is just a placeholder that returns dummy data
      return {
        pubkey: uri.substring(9, 73), // Simplified - not actual TLV parsing
        relays: ["wss://relay.nostr.band", "wss://nos.lol"]
      };
    } catch (error) {
      console.error("Error parsing nprofile URI:", error);
      return null;
    }
  },
  
  /**
   * Clear all stored relay data
   * Mainly used for testing
   */
  clearAllData() {
    profileRelayScores.clear();
  }
};
