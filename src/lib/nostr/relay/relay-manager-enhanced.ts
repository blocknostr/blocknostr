import { Relay } from "@/lib/nostr/types";
import { circuitBreaker, CircuitState } from "./circuit/circuit-breaker";

export class RelayManagerEnhanced {
  private relays: Map<string, any> = new Map();
  private pool: any;
  private connectionPromises: Map<string, Promise<any>> = new Map();
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionAttempts: Map<string, number> = new Map();
  private maxConnectionAttempts = 3;
  private connectionTimeout = 10000; // 10 seconds
  
  constructor(pool: any) {
    this.pool = pool;
  }
  
  /**
   * Add a relay to the manager
   * @param url Relay URL
   * @param options Connection options
   * @returns Promise resolving to success status
   */
  async addRelay(url: string, options: { read?: boolean, write?: boolean } = {}): Promise<boolean> {
    // Check if relay is already added
    if (this.relays.has(url)) {
      return true;
    }
    
    // Check circuit breaker state
    const circuitState = circuitBreaker.getState(url);
    if (circuitState === CircuitState.OPEN) {
      console.log(`Skipping relay ${url} due to circuit breaker open`);
      return false;
    }
    
    try {
      // Set default options
      const relayOptions = {
        read: options.read !== undefined ? options.read : true,
        write: options.write !== undefined ? options.write : true
      };
      
      // Add to pool
      this.pool.addRelay(url, relayOptions);
      
      // Track connection attempts
      const attempts = this.connectionAttempts.get(url) || 0;
      this.connectionAttempts.set(url, attempts + 1);
      
      // Create connection promise with timeout
      const connectionPromise = new Promise<boolean>((resolve, reject) => {
        // Set timeout
        const timeoutId = setTimeout(() => {
          reject(new Error(`Connection to ${url} timed out`));
        }, this.connectionTimeout);
        
        // Store timeout ID for cleanup
        this.connectionTimeouts.set(url, timeoutId);
        
        // Attempt connection
        this.pool.ensureRelay(url)
          .then(() => {
            clearTimeout(timeoutId);
            this.connectionTimeouts.delete(url);
            this.connectionAttempts.delete(url);
            resolve(true);
          })
          .catch((err: Error) => {
            clearTimeout(timeoutId);
            this.connectionTimeouts.delete(url);
            reject(err);
          });
      });
      
      // Store promise
      this.connectionPromises.set(url, connectionPromise);
      
      // Add to relays map with initial status
      this.relays.set(url, {
        url,
        status: 'connecting',
        ...relayOptions
      });
      
      // Wait for connection
      await connectionPromise;
      
      // Update status
      this.relays.set(url, {
        url,
        status: 'connected',
        ...relayOptions
      });
      
      // Record success in circuit breaker
      circuitBreaker.recordSuccess(url);
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to relay ${url}:`, error);
      
      // Update status
      this.relays.set(url, {
        url,
        status: 'failed',
        read: options.read !== undefined ? options.read : true,
        write: options.write !== undefined ? options.write : true
      });
      
      // Record failure in circuit breaker
      circuitBreaker.recordFailure(url);
      
      // If max attempts reached, remove relay
      const attempts = this.connectionAttempts.get(url) || 0;
      if (attempts >= this.maxConnectionAttempts) {
        console.log(`Max connection attempts reached for ${url}, removing relay`);
        this.removeRelay(url);
      }
      
      return false;
    }
  }
  
  /**
   * Remove a relay from the manager
   * @param url Relay URL
   */
  removeRelay(url: string): void {
    // Clean up any pending connection
    const timeoutId = this.connectionTimeouts.get(url);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.connectionTimeouts.delete(url);
    }
    
    // Remove from pool
    this.pool.removeRelay(url);
    
    // Remove from maps
    this.relays.delete(url);
    this.connectionPromises.delete(url);
    this.connectionAttempts.delete(url);
  }
  
  /**
   * Get all relay URLs
   * @returns Array of relay URLs
   */
  getRelayUrls(): string[] {
    return Array.from(this.relays.keys());
  }
  
  /**
   * Get relay status
   * @returns Array of relay status objects
   */
  getRelayStatus(): Relay[] {
    return Array.from(this.relays.values());
  }
  
  /**
   * Get relay status with enhanced information
   */
  getRelayStatusEnhanced(): Relay[] {
    const relays = this.getRelayStatus();
    
    // Convert status 'failed' to 'error' for type compatibility
    return relays.map(relay => {
      if (relay.status === 'failed') {
        return {
          ...relay,
          status: 'error'
        };
      }
      
      // Add score property if needed
      return {
        ...relay,
        score: this.calculateRelayScore(relay.url)
      };
    });
  }

  /**
   * Calculate a performance score for a relay
   * @param relayUrl URL of the relay
   * @returns Score from 0-100
   */
  private calculateRelayScore(relayUrl: string): number {
    // This is a placeholder implementation
    // In a real app, you would use actual metrics
    
    // Check circuit breaker state
    const circuitState = circuitBreaker.getState(relayUrl);
    if (circuitState === CircuitState.OPEN) {
      return 0; // Zero score for broken relays
    }
    
    // Base score between 40-80
    let score = 60;
    
    // Add some randomness for demo purposes
    // In real app, use actual metrics like response time, success rate, etc.
    score += Math.floor(Math.random() * 20);
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Get connected relay URLs
   * @returns Array of connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    const connected: string[] = [];
    
    this.relays.forEach((relay, url) => {
      if (relay.status === 'connected') {
        connected.push(url);
      }
    });
    
    return connected;
  }
  
  /**
   * Check if a relay is connected
   * @param url Relay URL
   * @returns Boolean indicating if relay is connected
   */
  isRelayConnected(url: string): boolean {
    const relay = this.relays.get(url);
    return relay?.status === 'connected';
  }
  
  /**
   * Get relay information
   * @param url Relay URL
   * @returns Relay information or null if not found
   */
  getRelayInformation(url: string): any {
    return this.relays.get(url) || null;
  }
  
  /**
   * Reset connection attempts for a relay
   * @param url Relay URL
   */
  resetConnectionAttempts(url: string): void {
    this.connectionAttempts.delete(url);
    circuitBreaker.reset(url);
  }
  
  /**
   * Set maximum connection attempts
   * @param attempts Maximum number of attempts
   */
  setMaxConnectionAttempts(attempts: number): void {
    this.maxConnectionAttempts = attempts;
  }
  
  /**
   * Set connection timeout
   * @param timeout Timeout in milliseconds
   */
  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }
}
