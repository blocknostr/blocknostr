import { SimplePool } from 'nostr-tools';
import { Relay } from '../types';
import { ConnectionManager } from './connection-manager';
import { HealthManager } from './health-manager';
import { RelayInfoService } from './relay-info-service';

/**
 * Main relay manager that coordinates all relay functionality
 */
export class RelayManager {
  private pool: SimplePool;
  private connectionManager: ConnectionManager;
  private healthManager: HealthManager;
  private _userRelays: Map<string, boolean> = new Map(); // Map<relayURL, readWrite>
  private defaultRelays: string[] = [
    'wss://relay.damus.io',
    'wss://nos.lol',
    'wss://nostr.bitcoiner.social',
    'wss://relay.nostr.band'
  ];
  private relayInfoService: RelayInfoService;
  private relays: Map<string, Relay> = new Map();

  constructor(pool: SimplePool) {
    this.pool = pool;
    this.connectionManager = new ConnectionManager();
    this.loadUserRelays();
    this.healthManager = new HealthManager(this.connectionManager, this._userRelays);
    this.relayInfoService = new RelayInfoService(pool);
    this.healthManager.startHealthCheck();
  }

  get userRelays(): Map<string, boolean> {
    return new Map(this._userRelays);
  }

  /**
   * Load user relays from local storage
   */
  loadUserRelays(): void {
    const savedRelays = localStorage.getItem('nostr_user_relays');
    if (savedRelays) {
      try {
        const relaysObject = JSON.parse(savedRelays);
        this._userRelays = new Map(Object.entries(relaysObject));
      } catch (e) {
        console.error('Error loading user relays:', e);
      }
    } else {
      // Default to the app's default relays
      this.defaultRelays.forEach(relay => {
        this._userRelays.set(relay, true); // Read/write by default
      });
    }
  }

  /**
   * Save user relays to local storage
   */
  saveUserRelays(): void {
    const relaysObject = Object.fromEntries(this._userRelays);
    localStorage.setItem('nostr_user_relays', JSON.stringify(relaysObject));
  }

  /**
   * Connect to a specific relay
   * @param relayUrl URL of the relay
   * @param retryCount Number of retry attempts
   * @returns Promise resolving to boolean indicating connection success
   */
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    return this.connectionManager.connectToRelay(relayUrl, retryCount);
  }

  /**
   * Connect to the default relays
   * @returns Promise resolving when connection attempts complete
   */
  async connectToDefaultRelays(): Promise<void> {
    return this.connectionManager.connectToRelays(this.defaultRelays);
  }

  /**
   * Connect to all user relays
   * @returns Promise resolving when connection attempts complete
   */
  async connectToUserRelays(): Promise<void> {
    return this.connectionManager.connectToRelays(Array.from(this._userRelays.keys()));
  }

  /**
   * Add a new relay to the user's relay list
   * @param relayUrl URL of the relay to add
   * @param readWrite Whether the relay should be read/write or read-only
   * @returns Promise resolving to boolean indicating success
   */
  async addRelay(relayUrl: string, readWrite: boolean = true): Promise<boolean> {
    // Validate URL format
    try {
      new URL(relayUrl);
    } catch (e) {
      return false;
    }

    // Add to user relays
    this._userRelays.set(relayUrl, readWrite);
    this.saveUserRelays();

    // Update health manager with new relays
    this.healthManager.updateUserRelays(this._userRelays);

    // Try to connect
    const connected = await this.connectToRelay(relayUrl);
    return connected;
  }

  /**
   * Remove a relay from the user's relay list
   * @param relayUrl URL of the relay to remove
   */
  removeRelay(relayUrl: string): void {
    this._userRelays.delete(relayUrl);
    this.saveUserRelays();

    // Update health manager
    this.healthManager.updateUserRelays(this._userRelays);

    // Disconnect
    this.connectionManager.disconnect(relayUrl);
  }

  /**
   * Get status of all relays
   * @returns Array of Relay objects with status information
   */
  getRelayStatus(): Relay[] {
    // First get all relays from userRelays
    const relayMap = new Map<string, Relay>();

    // Add all user relays first (even if not connected)
    Array.from(this._userRelays.keys()).forEach(url => {
      const isConnected = this.connectionManager.isConnected(url);

      relayMap.set(url, {
        url,
        status: isConnected ? 'connected' : 'disconnected',
        read: true,
        write: !!this._userRelays.get(url)
      });
    });

    // Add any connected relays that might not be in userRelays
    const connectedRelays = this.connectionManager.getConnectedRelayUrls();
    connectedRelays.forEach(url => {
      if (!relayMap.has(url)) {
        relayMap.set(url, {
          url,
          status: 'connected',
          read: true,
          write: true
        });
      }
    });

    return Array.from(relayMap.values());
  }

  /**
   * Add multiple relays at once
   * @param relayUrls Array of relay URLs to add
   * @returns Promise resolving to number of successfully added relays
   */
  async addMultipleRelays(relayUrls: string[]): Promise<number> {
    if (!relayUrls.length) return 0;

    let successCount = 0;

    for (const url of relayUrls) {
      try {
        const success = await this.addRelay(url);
        if (success) successCount++;
      } catch (error) {
        console.error(`Failed to add relay ${url}:`, error);
      }
    }

    return successCount;
  }

  /**
   * Set user relays map (used when loading from NIP-65)
   * @param relays Map of relay URLs to read/write status
   */
  setUserRelays(relays: Map<string, boolean>): void {
    this._userRelays = relays;
    this.saveUserRelays();

    // Update health manager
    this.healthManager.updateUserRelays(this._userRelays);

    // Connect to these relays
    this.connectToUserRelays();
  }

  /**
   * Pick best relays for a specific operation
   * @param operation 'read' or 'write' operation
   * @param count Number of relays to pick
   * @returns Array of relay URLs
   */
  pickBestRelays(operation: 'read' | 'write', count: number = 3): string[] {
    const connectedRelays = this.getRelayStatus()
      .filter(relay => relay.status === 'connected')
      .filter(relay => operation === 'read' || (operation === 'write' && relay.write));

    // If we have enough connected relays, use them
    if (connectedRelays.length >= count) {
      return connectedRelays.slice(0, count).map(relay => relay.url);
    }

    // Otherwise, return all available relays that match the criteria
    return connectedRelays.map(relay => relay.url);
  }

  /**
   * Get information about a relay using NIP-11
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay information or null
   */
  async getRelayInformation(relayUrl: string): Promise<any | null> {
    return this.relayInfoService.getRelayInfo(relayUrl);
  }

  /**
   * Check if a relay supports a specific NIP
   * @param relayUrl URL of the relay
   * @param nipNumber NIP number to check
   * @returns Promise resolving to boolean indicating support
   */
  async doesRelaySupport(relayUrl: string, nipNumber: number): Promise<boolean> {
    return this.relayInfoService.supportsNIP(relayUrl, nipNumber);
  }

  /**
   * Get relay limitations based on NIP-11
   * @param relayUrl URL of the relay
   * @returns Promise resolving to relay limitations
   */
  async getRelayLimitations(relayUrl: string): Promise<any | null> {
    return this.relayInfoService.getRelayLimitations(relayUrl);
  }

  /**
   * Retrieves a relay instance by its URL.
   * @param relayUrl - The URL of the relay to retrieve.
   * @returns The relay instance if found, or null if not found.
   */
  public getRelay(url: string): any {
    // Instead of using the pool's getRelay which doesn't exist,
    // we'll check our internal relays map
    return this.relays.get(url);
  }

  /**
   * Clean up when manager is destroyed
   */
  cleanup(): void {
    // Clean up health manager
    this.healthManager.cleanup();

    // Clean up connections
    this.connectionManager.cleanup();
  }
}
