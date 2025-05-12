
import { Relay } from "@/lib/nostr/types";
import { CircuitBreaker, CircuitStateValues, CircuitState } from "../circuit/circuit-breaker";

/**
 * RelayDiscoverer class to help discover and evaluate relays
 */
export class RelayDiscoverer {
  private knownRelays: Map<string, Relay> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private discoveredRelays: Map<string, {source: string, score: number}> = new Map();
  private defaultRelays: string[] = [
    "wss://relay.damus.io",
    "wss://nostr.bitcoiner.social",
    "wss://nostr.zebedee.cloud",
    "wss://relay.nostr.band",
    "wss://nos.lol"
  ];
  
  constructor(knownRelays?: string[]) {
    // Initialize with default relays and any provided
    const initialRelays = [...this.defaultRelays];
    if (knownRelays) {
      initialRelays.push(...knownRelays);
    }
    
    // Create map entries for known relays
    initialRelays.forEach(url => {
      this.knownRelays.set(url, {
        url,
        status: "unknown",
        read: true,
        write: true
      });
      
      // Create circuit breaker for each
      this.circuitBreakers.set(url, new CircuitBreaker());
    });
  }
  
  /**
   * Get a list of recommended relays based on circuit state
   */
  getRecommendedRelays(limit: number = 10): Relay[] {
    const availableRelays: Relay[] = [];
    
    // First get relays with closed circuit
    for (const [url, relay] of this.knownRelays.entries()) {
      const circuit = this.circuitBreakers.get(url);
      if (circuit && circuit.getState() === CircuitStateValues.CLOSED) {
        availableRelays.push(relay);
      }
      
      if (availableRelays.length >= limit) {
        break;
      }
    }
    
    // If we need more, add half-open circuits
    if (availableRelays.length < limit) {
      for (const [url, relay] of this.knownRelays.entries()) {
        if (availableRelays.some(r => r.url === url)) continue;
        
        const circuit = this.circuitBreakers.get(url);
        if (circuit && circuit.getState() === CircuitStateValues.HALF_OPEN) {
          availableRelays.push(relay);
        }
        
        if (availableRelays.length >= limit) {
          break;
        }
      }
    }
    
    return availableRelays;
  }
  
  /**
   * Record a successful connection to a relay
   */
  recordSuccess(url: string): void {
    // Get or create circuit breaker
    let circuit = this.circuitBreakers.get(url);
    if (!circuit) {
      circuit = new CircuitBreaker();
      this.circuitBreakers.set(url, circuit);
    }
    
    // Record success
    circuit.recordSuccess();
    
    // Update relay status
    const relay = this.knownRelays.get(url);
    if (relay) {
      relay.status = "connected";
    } else {
      this.knownRelays.set(url, {
        url,
        status: "connected",
        read: true,
        write: true
      });
    }
  }
  
  /**
   * Record a failed connection to a relay
   */
  recordFailure(url: string): void {
    // Get or create circuit breaker
    let circuit = this.circuitBreakers.get(url);
    if (!circuit) {
      circuit = new CircuitBreaker();
      this.circuitBreakers.set(url, circuit);
    }
    
    // Record failure
    circuit.recordFailure();
    
    // Update relay status
    const relay = this.knownRelays.get(url);
    if (relay) {
      relay.status = "failed";
    } else {
      this.knownRelays.set(url, {
        url,
        status: "failed",
        read: true,
        write: true
      });
    }
  }
  
  /**
   * Add a new relay to the known relays
   */
  addRelay(url: string): void {
    // Add to known relays if not already present
    if (!this.knownRelays.has(url)) {
      this.knownRelays.set(url, {
        url,
        status: "unknown",
        read: true,
        write: true
      });
      
      // Create circuit breaker
      this.circuitBreakers.set(url, new CircuitBreaker());
    }
  }
  
  /**
   * Get all known relays
   */
  getAllRelays(): Relay[] {
    return Array.from(this.knownRelays.values());
  }
  
  /**
   * Get relay's circuit state
   */
  getRelayCircuitState(url: string): CircuitState | null {
    const circuit = this.circuitBreakers.get(url);
    return circuit ? circuit.getState() : null;
  }

  /**
   * Add a discovered relay with source information
   */
  addDiscoveredRelay(url: string, source: string): void {
    if (!url.startsWith('wss://')) return;
    
    const existingRelay = this.discoveredRelays.get(url);
    if (existingRelay) {
      // Increase score if discovered from multiple sources
      existingRelay.score += 10;
    } else {
      this.discoveredRelays.set(url, {
        source,
        score: 50 // Default score
      });
    }
  }

  /**
   * Get all discovered relays
   */
  getDiscoveredRelays(): string[] {
    return Array.from(this.discoveredRelays.keys());
  }

  /**
   * Get best relays to try connecting to
   */
  getBestRelaysToTry(count: number, excludeUrls: string[]): string[] {
    const candidates = Array.from(this.discoveredRelays.entries())
      .filter(([url]) => !excludeUrls.includes(url))
      .sort((a, b) => b[1].score - a[1].score);
    
    return candidates.slice(0, count).map(([url]) => url);
  }

  /**
   * Discover relays from contacts
   */
  async discoverFromContacts(pubkeys: string[]): Promise<string[]> {
    // This is a placeholder implementation
    // In a real implementation, it would fetch contacts' relay lists
    return [];
  }

  /**
   * Test a relay connection
   */
  async testRelay(url: string): Promise<boolean> {
    try {
      // Create a WebSocket connection with timeout
      return new Promise((resolve) => {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
          ws.close();
          resolve(false);
        }, 5000);
        
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          this.addDiscoveredRelay(url, 'test');
          resolve(true);
        };
        
        ws.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (error) {
      console.error(`Error testing relay ${url}:`, error);
      return false;
    }
  }
}
