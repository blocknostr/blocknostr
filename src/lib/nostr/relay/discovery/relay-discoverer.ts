
import { SimplePool } from 'nostr-tools';
import { relayPerformanceTracker } from '../performance/relay-performance-tracker';
import { circuitBreaker, CircuitState } from '../circuit/circuit-breaker';

/**
 * Interface for discovered relay information
 */
export interface DiscoveredRelay {
  url: string;
  source: 'contact' | 'contact-list' | 'nip65' | 'popular' | 'manual' | 'meta';
  score?: number;
  addedAt: number;
}

/**
 * Service for discovering new relays dynamically
 */
export class RelayDiscoverer {
  // Keep track of discovered relays and their source
  private discoveredRelays: Map<string, DiscoveredRelay> = new Map();
  // Popular relays based on community knowledge
  private popularRelays: string[] = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://relay.nostr.band',
    'wss://nostr.wine',
    'wss://relay.nostr.info',
    'wss://relay.snort.social',
    'wss://nostr.mutinywallet.com',
    'wss://purplepag.es',
    'wss://relay.plebstr.com',
    'wss://relay.primal.net'
  ];
  
  /**
   * Initialize the relay discoverer
   */
  constructor(private pool: SimplePool) {
    // Add popular relays as initial discoveries
    this.popularRelays.forEach(url => {
      this.addDiscoveredRelay(url, 'popular');
    });
  }
  
  /**
   * Start discovery process from known contacts
   * @param pubkeys Array of pubkeys to check for relays
   */
  async discoverFromContacts(pubkeys: string[]): Promise<DiscoveredRelay[]> {
    if (!pubkeys.length) return [];
    
    const newDiscoveries: DiscoveredRelay[] = [];
    let processedRelays = new Set<string>();
    
    try {
      // Find relays used by contacts (NIP-65)
      console.log(`Discovering relays from ${pubkeys.length} contacts...`);
      
      // Function to process a user's relay list
      const processRelayListEvent = (event: any) => {
        if (event.kind !== 10002) return;
        
        try {
          // Extract relay URLs from tags (NIP-65 format)
          const relayUrls = event.tags
            .filter((tag: string[]) => tag.length >= 2 && tag[0] === 'r')
            .map((tag: string[]) => tag[1]);
          
          relayUrls.forEach(url => {
            if (!processedRelays.has(url)) {
              processedRelays.add(url);
              this.addDiscoveredRelay(url, 'nip65');
              newDiscoveries.push({
                url,
                source: 'nip65',
                addedAt: Date.now()
              });
            }
          });
        } catch (error) {
          console.error('Error processing relay list event:', error);
        }
      };
      
      // Function to process a contact list event
      const processContactListEvent = (event: any) => {
        if (event.kind !== 3) return;
        
        try {
          // Extract relay hints from tags (older format)
          event.tags
            .filter((tag: string[]) => tag.length >= 3 && tag[0] === 'p')
            .forEach((tag: string[]) => {
              // Some clients put relay hints in the 3rd position of 'p' tags
              if (tag[2] && typeof tag[2] === 'string' && tag[2].startsWith('wss://')) {
                const url = tag[2];
                if (!processedRelays.has(url)) {
                  processedRelays.add(url);
                  this.addDiscoveredRelay(url, 'contact-list');
                  newDiscoveries.push({
                    url,
                    source: 'contact-list',
                    addedAt: Date.now()
                  });
                }
              }
            });
        } catch (error) {
          console.error('Error processing contact list event:', error);
        }
      };
      
      // First look for NIP-65 relay lists
      const allConnectedRelays = Array.from(processedRelays);
      const relayListEvents = await this.fetchEvents(allConnectedRelays, { kinds: [10002], authors: pubkeys });
      relayListEvents.forEach(processRelayListEvent);
      
      // Then check contact lists as fallback
      const contactListEvents = await this.fetchEvents(allConnectedRelays, { kinds: [3], authors: pubkeys });
      contactListEvents.forEach(processContactListEvent);
      
      return newDiscoveries;
    } catch (error) {
      console.error('Error discovering relays from contacts:', error);
      return [];
    }
  }
  
  /**
   * Helper method to fetch events with timeout
   * @param relays Array of relay URLs
   * @param filter Event filter
   * @param timeout Timeout in milliseconds
   */
  private async fetchEvents(
    relays: string[], 
    filter: { kinds: number[], authors?: string[] },
    timeout: number = 5000
  ): Promise<any[]> {
    return new Promise((resolve) => {
      const events: any[] = [];
      
      // Set timeout to resolve after specified time
      const timeoutId = setTimeout(() => {
        resolve(events);
      }, timeout);
      
      try {
        // Use correct method for SimplePool - it's 'subscribeMany' not 'sub'
        const subscription = this.pool.subscribeMany(relays, [filter], {
          onevent: (event: any) => {
            events.push(event);
          },
          oneose: () => {
            clearTimeout(timeoutId);
            resolve(events);
            // Fix: Correctly call close method on the subscription object directly
            subscription.close();
          }
        });
      } catch (error) {
        console.error('Error fetching events:', error);
        clearTimeout(timeoutId);
        resolve(events);
      }
    });
  }
  
  /**
   * Add a discovered relay
   * @param url Relay URL
   * @param source Source of the discovery
   */
  addDiscoveredRelay(url: string, source: DiscoveredRelay['source']): void {
    // Normalize URL format
    const normalizedUrl = this.normalizeRelayUrl(url);
    if (!normalizedUrl) return;
    
    // Check if already discovered
    if (this.discoveredRelays.has(normalizedUrl)) {
      return;
    }
    
    // Add to discovered relays
    this.discoveredRelays.set(normalizedUrl, {
      url: normalizedUrl,
      source,
      addedAt: Date.now()
    });
  }
  
  /**
   * Get all discovered relays
   * @returns Array of discovered relay data
   */
  getDiscoveredRelays(): DiscoveredRelay[] {
    return Array.from(this.discoveredRelays.values());
  }
  
  /**
   * Helper to normalize relay URLs
   * @param url Relay URL to normalize
   * @returns Normalized URL or undefined if invalid
   */
  private normalizeRelayUrl(url: string): string | undefined {
    try {
      // Basic validation
      if (!url.startsWith('wss://') && !url.startsWith('ws://')) {
        return undefined;
      }
      
      // Parse URL to standardize format
      const parsedUrl = new URL(url);
      return parsedUrl.href;
    } catch (error) {
      console.warn(`Invalid relay URL: ${url}`);
      return undefined;
    }
  }
  
  /**
   * Test a relay's connectivity and performance
   * @param url Relay URL to test
   * @param timeout Timeout in milliseconds
   * @returns Promise resolving to boolean indicating success
   */
  async testRelay(url: string, timeout: number = 3000): Promise<boolean> {
    try {
      const startTime = performance.now();
      
      // Avoid testing relays that are in open circuit state - fixed enum comparison
      if (circuitBreaker.getState(url) === CircuitState.OPEN) {
        return false;
      }
      
      // Simple connection test
      const socket = new WebSocket(url);
      
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          socket.close();
          // Record performance metrics
          relayPerformanceTracker.recordFailure(url, 'connect', 'Timeout');
          circuitBreaker.recordFailure(url);
          resolve(false);
        }, timeout);
        
        socket.onopen = () => {
          clearTimeout(timeoutId);
          const duration = performance.now() - startTime;
          
          // Record performance metrics
          relayPerformanceTracker.trackResponseTime(url, 'connect', duration);
          circuitBreaker.recordSuccess(url);
          
          // Close the connection after successful test
          socket.close();
          resolve(true);
        };
        
        socket.onerror = () => {
          clearTimeout(timeoutId);
          // Record performance metrics
          relayPerformanceTracker.recordFailure(url, 'connect', 'Connection error');
          circuitBreaker.recordFailure(url);
          socket.close();
          resolve(false);
        };
      });
    } catch (error) {
      console.error(`Error testing relay ${url}:`, error);
      // Record performance metrics
      relayPerformanceTracker.recordFailure(url, 'connect', String(error));
      circuitBreaker.recordFailure(url);
      return false;
    }
  }
  
  /**
   * Find the best new relays to try
   * @param count Number of relays to return
   * @param excludeUrls Array of relay URLs to exclude
   * @returns Array of relay URLs
   */
  getBestRelaysToTry(count: number = 3, excludeUrls: string[] = []): string[] {
    const excludeSet = new Set(excludeUrls);
    
    // Get all discovered relays not in the exclude list
    const availableRelays = Array.from(this.discoveredRelays.values())
      .filter(relay => !excludeSet.has(relay.url))
      // Don't recommend relays with open circuit breakers - fixed enum comparison
      .filter(relay => circuitBreaker.getState(relay.url) !== CircuitState.OPEN);
    
    if (availableRelays.length === 0) {
      return [];
    }
    
    // Sort by discovery source preference
    const sourceWeight: Record<string, number> = {
      'nip65': 5,
      'contact': 4,
      'contact-list': 3,
      'popular': 2,
      'meta': 1,
      'manual': 0
    };
    
    // Sort by source weight and recency (newer discoveries prioritized)
    availableRelays.sort((a, b) => {
      const sourceComparison = (sourceWeight[b.source] || 0) - (sourceWeight[a.source] || 0);
      if (sourceComparison !== 0) return sourceComparison;
      
      // If same source, prefer more recent discoveries
      return b.addedAt - a.addedAt;
    });
    
    // Return the best relays up to the requested count
    return availableRelays.slice(0, count).map(relay => relay.url);
  }
}
