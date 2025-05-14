import { SimplePool } from 'nostr-tools';

/**
 * Connection pool for managing Nostr relay connections
 * Based on best practices from iris.to
 */
export class ConnectionPool {
  private static instance: ConnectionPool;
  private connections: Map<string, WebSocket> = new Map();
  private pool: SimplePool;
  
  // Maximum allowed connections to prevent browser crashes
  private readonly MAX_CONNECTIONS = 15;
  
  // Connection status tracking
  private connectionStatus: Map<string, {
    status: 'connected' | 'connecting' | 'disconnected',
    lastAttempt: number,
    failures: number
  }> = new Map();
  
  private constructor() {
    this.pool = new SimplePool();
    
    // Set up periodic connection cleanup
    setInterval(() => this.cleanupConnections(), 60000); // Run every minute
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }
  
  /**
   * Get the SimplePool instance
   */
  public getPool(): SimplePool {
    return this.pool;
  }
  
  /**
   * Connect to a relay with connection limits and retry logic
   */
  public async connectToRelay(relayUrl: string): Promise<boolean> {
    // If already connected, return immediately
    if (this.isConnected(relayUrl)) {
      return true;
    }
    
    // Track connection attempt
    const status = this.connectionStatus.get(relayUrl) || {
      status: 'disconnected',
      lastAttempt: 0,
      failures: 0
    };
    
    status.lastAttempt = Date.now();
    status.status = 'connecting';
    this.connectionStatus.set(relayUrl, status);
    
    // Check if we've reached connection limit
    if (this.connections.size >= this.MAX_CONNECTIONS) {
      console.warn(`Connection limit (${this.MAX_CONNECTIONS}) reached. Pruning least recently used connection.`);
      this.pruneOldestConnection();
    }
    
    try {
      // Create WebSocket connection
      const socket = new WebSocket(relayUrl);
      
      return new Promise((resolve) => {
        socket.onopen = () => {
          this.connections.set(relayUrl, socket);
          status.status = 'connected';
          status.failures = 0;
          this.connectionStatus.set(relayUrl, status);
          console.log(`Connected to relay: ${relayUrl}`);
          resolve(true);
        };
        
        socket.onerror = (error) => {
          console.error(`Error connecting to relay ${relayUrl}:`, error);
          status.failures++;
          status.status = 'disconnected';
          this.connectionStatus.set(relayUrl, status);
          resolve(false);
        };
        
        socket.onclose = () => {
          this.connections.delete(relayUrl);
          status.status = 'disconnected';
          this.connectionStatus.set(relayUrl, status);
          console.log(`Disconnected from relay: ${relayUrl}`);
        };
        
        // Set connection timeout
        setTimeout(() => {
          if (socket.readyState !== WebSocket.OPEN) {
            socket.close();
            status.failures++;
            status.status = 'disconnected';
            this.connectionStatus.set(relayUrl, status);
            console.log(`Connection timeout for relay: ${relayUrl}`);
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error(`Failed to connect to relay ${relayUrl}:`, error);
      status.failures++;
      status.status = 'disconnected';
      this.connectionStatus.set(relayUrl, status);
      return false;
    }
  }
  
  /**
   * Connect to multiple relays
   */
  public async connectToRelays(relayUrls: string[]): Promise<string[]> {
    const uniqueUrls = [...new Set(relayUrls)]; // Remove duplicates
    const results: boolean[] = await Promise.all(
      uniqueUrls.map(url => this.connectToRelay(url))
    );
    
    // Return successful connections
    return uniqueUrls.filter((_, index) => results[index]);
  }
  
  /**
   * Check if connected to a relay
   */
  public isConnected(relayUrl: string): boolean {
    const socket = this.connections.get(relayUrl);
    return socket?.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get all connected relay URLs
   */
  public getConnectedRelays(): string[] {
    return Array.from(this.connections.keys()).filter(url => this.isConnected(url));
  }
  
  /**
   * Disconnect from a relay
   */
  public disconnect(relayUrl: string): void {
    const socket = this.connections.get(relayUrl);
    if (socket) {
      socket.close();
      this.connections.delete(relayUrl);
      
      // Update status
      const status = this.connectionStatus.get(relayUrl);
      if (status) {
        status.status = 'disconnected';
        this.connectionStatus.set(url, status);
      }
      
      console.log(`Manually disconnected from relay: ${relayUrl}`);
    }
  }
  
  /**
   * Disconnect from all relays
   */
  public disconnectAll(): void {
    this.connections.forEach((socket, url) => {
      socket.close();
      console.log(`Closing connection to relay: ${url}`);
    });
    
    this.connections.clear();
    
    // Update all statuses
    this.connectionStatus.forEach((status, url) => {
      status.status = 'disconnected';
      this.connectionStatus.set(url, status);
    });
  }
  
  /**
   * Get connection metrics
   */
  public getMetrics(): {
    totalConnections: number,
    activeConnections: number,
    maxConnections: number
  } {
    const activeConnections = this.getConnectedRelays().length;
    
    return {
      totalConnections: this.connections.size,
      activeConnections,
      maxConnections: this.MAX_CONNECTIONS
    };
  }
  
  /**
   * Remove the oldest connection to make room for new ones
   */
  private pruneOldestConnection(): void {
    // Find the oldest connection (simple implementation - can be improved with LRU)
    const oldestRelay = Array.from(this.connections.keys())[0];
    if (oldestRelay) {
      console.log(`Pruning connection to relay: ${oldestRelay}`);
      this.disconnect(oldestRelay);
    }
  }
  
  /**
   * Cleanup idle connections to prevent resource leaks
   */
  private cleanupConnections(): void {
    console.log(`Running connection cleanup. Current connections: ${this.connections.size}`);
    
    // Close connections that have been idle for too long
    // This is a simplified version - a more complex implementation could track last activity
    if (this.connections.size > 5) { // Keep at least 5 connections
      // Find connections to prune (keeping the 5 most recent)
      const relaysToKeep = this.getConnectedRelays().slice(-5);
      const relaysToPrune = this.getConnectedRelays().filter(url => !relaysToKeep.includes(url));
      
      // Prune excess connections
      relaysToPrune.forEach(url => {
        console.log(`Cleaning up idle connection to relay: ${url}`);
        this.disconnect(url);
      });
    }
  }
}
