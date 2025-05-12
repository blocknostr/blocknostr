
import { Relay } from "@/lib/nostr/types";
import { CircuitBreaker, CircuitStateValues } from "../circuit/circuit-breaker";

/**
 * RelayDiscoverer class to help discover and evaluate relays
 */
export class RelayDiscoverer {
  private knownRelays: Map<string, Relay> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
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
}
