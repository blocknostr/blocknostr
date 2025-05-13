import { SimplePool } from 'nostr-tools';
import { Relay } from '../types';
import { ConnectionManager } from './connection-manager';
import { HealthManager } from './health-manager';
import { RelayInfoService } from './relay-info-service';
import { relayPerformanceTracker } from './performance/relay-performance-tracker';
import { relaySelector } from './selection/relay-selector';
import { CircuitBreaker, circuitBreaker, CircuitState } from './circuit/circuit-breaker';
import { RelayDiscoverer } from './discovery/relay-discoverer';

// Import just the type, not the implementation that might not be exported
type RelayMetrics = {
  responseTime: number;
  successRate: number;
  lastSuccess: number;
  lastAttempt: number;
};

/**
 * Enhanced relay manager that incorporates performance tracking and smart selection
 */
export class RelayManagerEnhanced {
  private pool: SimplePool;
  private connectionManager: ConnectionManager;
  private healthManager: HealthManager;
  private relayUrls: string[] = [];
  private relays: Record<string, Relay> = {};
  private defaultRelays: string[] = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band"
  ];
  private relayInfoService: RelayInfoService;
  private relayDiscoverer: RelayDiscoverer;
  private performanceTracker = relayPerformanceTracker;
  private discoveryRunning: boolean = false;
  
  constructor(pool: SimplePool) {
    this.pool = pool;
    this.connectionManager = new ConnectionManager(pool);
    this.healthManager = new HealthManager();
    this.relayInfoService = new RelayInfoService();
    this.relayDiscoverer = new RelayDiscoverer(this.relayInfoService);
  }
  
  /**
   * Initializes the relay connections using a list of relay URLs.
   * It establishes connections, checks the relay health, and retrieves relay information.
   *
   * @param {string[]} relayUrls - An array of relay URLs to initialize.
   * @returns {Promise<void>}
   */
  async initializeRelays(relayUrls: string[]): Promise<void> {
    try {
      this.relayUrls = relayUrls;
      await this.connectToRelays(relayUrls);
    } catch (error) {
      console.error("Error initializing relays:", error);
      throw error;
    }
  }
  
  /**
   * Connects to multiple relays concurrently.
   *
   * @param {string[]} relayUrls - An array of relay URLs to connect to.
   * @returns {Promise<void>}
   */
  async connectToRelays(relayUrls: string[]): Promise<void> {
    try {
      await Promise.all(relayUrls.map(url => this.connectToRelay(url)));
    } catch (error) {
      console.error("Error connecting to relays:", error);
      throw error;
    }
  }
  
  /**
   * Establishes a connection to a single relay and retrieves its information.
   *
   * @param {string} relayUrl - The URL of the relay to connect to.
   * @param {number} retryCount - The number of times to retry the connection.
   * @returns {Promise<boolean>} - A boolean indicating whether the connection was successful.
   */
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    try {
      const relay = this.pool.ensureRelay(relayUrl);
      
      relay.on('connect', () => {
        console.log(`Connected to relay: ${relayUrl}`);
        this.healthManager.setRelayStatus(relayUrl, 'connected');
      });
      
      relay.on('disconnect', () => {
        console.log(`Disconnected from relay: ${relayUrl}`);
        this.healthManager.setRelayStatus(relayUrl, 'disconnected');
      });
      
      relay.on('error', () => {
        console.log(`Error from relay: ${relayUrl}`);
        this.healthManager.setRelayStatus(relayUrl, 'error');
      });
      
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Timeout connecting to relay: ${relayUrl}`));
        }, 5000);
        
        relay.on('connect', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        relay.on('error', () => {
          clearTimeout(timeout);
          reject(new Error(`Failed to connect to relay: ${relayUrl}`));
        });
      });
      
      this.relays[relayUrl] = relay;
      return true;
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl} (attempt ${retryCount + 1}):`, error);
      this.healthManager.setRelayStatus(relayUrl, 'error');
      
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.connectToRelay(relayUrl, retryCount + 1);
      }
      
      return false;
    }
  }
  
  /**
   * Adds a relay to the list of connected relays.
   *
   * @param {string} relayUrl - The URL of the relay to add.
   * @param {boolean} readWrite - Whether the relay should be used for reading and writing.
   * @returns {Promise<boolean>} - A boolean indicating whether the relay was successfully added.
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    if (!this.relayUrls.includes(relayUrl)) {
      this.relayUrls.push(relayUrl);
      try {
        const connected = await this.connectToRelay(relayUrl);
        if (connected) {
          console.log(`Relay added: ${relayUrl}`);
          return true;
        } else {
          console.warn(`Failed to connect to relay: ${relayUrl}`);
          return false;
        }
      } catch (error) {
        console.error(`Error adding relay ${relayUrl}:`, error);
        return false;
      }
    } else {
      console.log(`Relay already exists: ${relayUrl}`);
      return false;
    }
  }
  
  /**
   * Removes a relay from the list of connected relays.
   *
   * @param {string} relayUrl - The URL of the relay to remove.
   * @returns {void}
   */
  removeRelay(relayUrl: string): void {
    if (this.relayUrls.includes(relayUrl)) {
      this.relayUrls = this.relayUrls.filter(url => url !== relayUrl);
      delete this.relays[relayUrl];
      console.log(`Relay removed: ${relayUrl}`);
    } else {
      console.log(`Relay not found: ${relayUrl}`);
    }
  }
  
  /**
   * Adds multiple relays to the list of connected relays.
   *
   * @param {string[]} relayUrls - An array of relay URLs to add.
   * @returns {Promise<number>} - The number of relays successfully added.
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    let successCount = 0;
    for (const url of relayUrls) {
      const added = await this.addRelay(url);
      if (added) {
        successCount++;
      }
    }
    return successCount;
  }
  
  /**
   * Retrieves information about a relay using the NIP-11 protocol.
   *
   * @param {string} relayUrl - The URL of the relay to retrieve information from.
   * @returns {Promise<any | null>} - The relay information, or null if the information could not be retrieved.
   */
  async getRelayInformation(relayUrl: string): Promise<any | null> {
    try {
      const info = await this.relayInfoService.fetchRelayInformation(relayUrl);
      return info;
    } catch (error) {
      console.error(`Failed to get relay information for ${relayUrl}:`, error);
      return null;
    }
  }
  
  /**
   * Checks if a relay supports a specific NIP (Nostr Improvement Proposal).
   *
   * @param {string} relayUrl - The URL of the relay to check.
   * @param {number} nipNumber - The number of the NIP to check for.
   * @returns {Promise<boolean>} - A boolean indicating whether the relay supports the NIP.
   */
  async doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean> {
    try {
      const relayInfo = await this.getRelayInformation(relayUrl);
      if (relayInfo && relayInfo.supported_nips) {
        return relayInfo.supported_nips.includes(nipNumber);
      }
      return false;
    } catch (error) {
      console.error(`Failed to check NIP support for ${relayUrl}:`, error);
      return false;
    }
  }
}
