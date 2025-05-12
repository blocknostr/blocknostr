/**
 * Discovers relays from different sources
 */
export class RelayDiscoverer {
  private knownRelays: Map<string, { found: number, success: number, failure: number }> = new Map();
  private relaysToTry: string[] = [];
  
  constructor(initialRelays: string[] = []) {
    // Add initial relays to known relays
    initialRelays.forEach(url => this.addRelay(url));
    
    // Add some well-known relays
    this.addRelay('wss://relay.damus.io');
    this.addRelay('wss://relay.nostr.band');
    this.addRelay('wss://nos.lol');
    this.addRelay('wss://nostr.bitcoiner.social');
  }
  
  /**
   * Add a relay to the list of known relays
   * @param url URL of the relay to add
   */
  addRelay(url: string): void {
    if (!this.knownRelays.has(url)) {
      this.knownRelays.set(url, { found: 1, success: 0, failure: 0 });
      this.relaysToTry.push(url);
    }
  }
  
  /**
   * Record a successful connection to a relay
   * @param url URL of the relay
   */
  recordSuccess(url: string): void {
    if (!this.knownRelays.has(url)) {
      this.addRelay(url);
    }
    
    const stats = this.knownRelays.get(url)!;
    stats.success += 1;
    this.knownRelays.set(url, stats);
  }
  
  /**
   * Record a failed connection to a relay
   * @param url URL of the relay
   */
  recordFailure(url: string): void {
    if (!this.knownRelays.has(url)) {
      this.addRelay(url);
    }
    
    const stats = this.knownRelays.get(url)!;
    stats.failure += 1;
    this.knownRelays.set(url, stats);
  }
  
  /**
   * Get the best relays to try based on success ratio
   * @param count Number of relays to return
   * @returns Array of relay URLs
   */
  getBestRelaysToTry(count: number = 3): string[] {
    // Sort relays by success ratio
    const sortedRelays = Array.from(this.knownRelays.entries())
      .sort((a, b) => {
        const aRatio = a[1].success / (a[1].success + a[1].failure || 1);
        const bRatio = b[1].success / (b[1].success + b[1].failure || 1);
        return bRatio - aRatio;
      })
      .map(([url]) => url);
    
    // Return the top N relays
    return sortedRelays.slice(0, count);
  }
  
  /**
   * Get all discovered relays
   * @returns Array of relay URLs
   */
  getDiscoveredRelays(): string[] {
    return Array.from(this.knownRelays.keys());
  }
  
  /**
   * Test a relay connection
   * @param url URL of the relay to test
   * @returns Promise resolving to boolean indicating success
   */
  async testRelay(url: string): Promise<boolean> {
    try {
      // Simple ping test using WebSocket
      return new Promise((resolve) => {
        try {
          const socket = new WebSocket(url);
          
          socket.onopen = () => {
            socket.close();
            this.recordSuccess(url);
            resolve(true);
          };
          
          socket.onerror = () => {
            socket.close();
            this.recordFailure(url);
            resolve(false);
          };
          
          // Set timeout
          setTimeout(() => {
            if (socket.readyState !== WebSocket.CLOSED) {
              socket.close();
              this.recordFailure(url);
              resolve(false);
            }
          }, 5000);
        } catch (e) {
          this.recordFailure(url);
          resolve(false);
        }
      });
    } catch (e) {
      this.recordFailure(url);
      return false;
    }
  }
  
  /**
   * Add a discovered relay with additional metadata
   * @param url URL of the relay
   * @param source Source of the discovery (e.g., 'contact', 'metadata')
   */
  addDiscoveredRelay(url: string, source: string = 'manual'): void {
    // Add to known relays
    this.addRelay(url);
    
    // Could log or track discovery source if needed
    console.log(`Discovered relay ${url} from ${source}`);
  }
  
  /**
   * Discover relays from user contacts (public keys followed)
   * @param pubkeys Array of public keys to check
   * @returns Promise resolving to number of relays discovered
   */
  async discoverFromContacts(pubkeys: string[]): Promise<number> {
    // This is a placeholder for the actual implementation
    // In a real implementation, we would:
    // 1. For each pubkey, try to fetch their NIP-65 relay list
    // 2. Add any new relays to our list
    console.log(`Discovering relays from ${pubkeys.length} contacts`);
    return 0;
  }
}
