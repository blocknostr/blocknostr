import { SimplePool } from 'nostr-tools';

/**
 * Manages connections to Nostr relays
 */
export class ConnectionManager {
  private relays: Map<string, WebSocket> = new Map();
  private connectionStatus: Map<string, { connected: boolean, lastAttempt: number, failures: number }> = new Map();
  private reconnectTimers: Map<string, number> = new Map();

  constructor() { }

  /**
   * Connect to a specific relay
   * @param relayUrl URL of the relay to connect to
   * @param retryCount Number of previous attempts (used for backoff)
   * @returns Promise resolving to boolean indicating connection success
   */
  async connectToRelay(relayUrl: string, retryCount: number = 0): Promise<boolean> {
    if (this.relays.has(relayUrl) && this.relays.get(relayUrl)?.readyState === WebSocket.OPEN) {
      return true; // Already connected
    }

    // Track connection attempt
    if (!this.connectionStatus.has(relayUrl)) {
      this.connectionStatus.set(relayUrl, { connected: false, lastAttempt: Date.now(), failures: 0 });
    }

    const status = this.connectionStatus.get(relayUrl)!;
    status.lastAttempt = Date.now();

    // Clear any existing reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }

    try {
      const socket = new WebSocket(relayUrl);

      return new Promise((resolve) => {
        socket.onopen = () => {
          this.relays.set(relayUrl, socket);
          status.connected = true;
          status.failures = 0;
          resolve(true);
        };

        socket.onerror = () => {
          status.failures++;
          resolve(false);
        };

        socket.onclose = () => {
          status.connected = false;
          this.relays.delete(relayUrl);

          // Exponential backoff for reconnection (max ~1 minute)
          if (retryCount < 6) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 60000);
            const timerId = window.setTimeout(() => {
              this.connectToRelay(relayUrl, retryCount + 1);
            }, delay);
            this.reconnectTimers.set(relayUrl, timerId);
          }
        };

        socket.onmessage = (msg) => {
          try {
            const data = JSON.parse(msg.data);
            // Handle different types of messages from the relay
            // Event handling happens in the NostrService class
          } catch (e) {
            console.error('Error parsing relay message:', e);
          }
        };

        // Set timeout for connection
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      status.failures++;
      return false;
    }
  }

  /**
   * Connect to multiple relays at once
   * @param relayUrls Array of relay URLs to connect to
   * @returns Promise resolving when all connection attempts complete
   */
  async connectToRelays(relayUrls: string[]): Promise<{ success: string[]; failures: string[] }> {
    const success: string[] = [];
    const failures: string[] = [];

    for (const url of relayUrls) {
      let attempts = 0;
      let connected = false;

      while (attempts < 3 && !connected) {
        try {
          attempts++;
          console.log(`Attempting to connect to relay: ${url} (Attempt ${attempts})`);
          connected = await this.connectToRelay(url);

          if (connected) {
            success.push(url);
            console.log(`Successfully connected to relay: ${url}`);
          } else {
            throw new Error(`Connection failed for relay: ${url}`);
          }
        } catch (error) {
          console.error(`Error connecting to relay ${url} on attempt ${attempts}:`, error);

          if (attempts === 3) {
            failures.push(url);
            console.warn(`Failed to connect to relay after 3 attempts: ${url}`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts))); // Exponential backoff
          }
        }
      }
    }

    return { success, failures };
  }

  /**
   * Get the websocket for a connected relay
   * @param relayUrl URL of the relay
   * @returns WebSocket instance or undefined if not connected
   */
  getRelaySocket(relayUrl: string): WebSocket | undefined {
    return this.relays.get(relayUrl);
  }

  /**
   * Get URLs of all connected relays
   * @returns Array of connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    return Array.from(this.relays.keys())
      .filter(url => this.relays.get(url)?.readyState === WebSocket.OPEN);
  }

  /**
   * Check if a relay is connected
   * @param relayUrl URL of the relay
   * @returns Boolean indicating if relay is connected
   */
  isConnected(relayUrl: string): boolean {
    return this.relays.has(relayUrl) &&
      this.relays.get(relayUrl)?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect from a relay
   * @param relayUrl URL of the relay to disconnect from
   */
  disconnect(relayUrl: string): void {
    const socket = this.relays.get(relayUrl);
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      socket.close();
      this.relays.delete(relayUrl);
    }

    // Clear any reconnect timer
    if (this.reconnectTimers.has(relayUrl)) {
      window.clearTimeout(this.reconnectTimers.get(relayUrl));
      this.reconnectTimers.delete(relayUrl);
    }
  }

  /**
   * Clean up all connections and timers
   */
  cleanup(): void {
    // Close all open connections
    this.relays.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    });

    this.relays.clear();

    // Clear all reconnect timers
    this.reconnectTimers.forEach((timerId) => {
      window.clearTimeout(timerId);
    });

    this.reconnectTimers.clear();
  }
}
