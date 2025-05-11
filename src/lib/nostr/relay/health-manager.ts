
import { ConnectionManager } from './connection-manager';

/**
 * Manages health checks for relay connections
 */
export class HealthManager {
  private connectionManager: ConnectionManager;
  private healthCheckInterval: number | null = null;
  private userRelays: Map<string, boolean>;
  
  constructor(connectionManager: ConnectionManager, userRelays: Map<string, boolean>) {
    this.connectionManager = connectionManager;
    this.userRelays = userRelays;
  }
  
  /**
   * Start periodic health checks of relay connections
   * @param interval Interval in milliseconds between checks
   */
  startHealthCheck(interval: number = 30000): void {
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
    }
    
    // Check relay health periodically
    this.healthCheckInterval = window.setInterval(() => {
      this.performHealthCheck();
    }, interval);
  }
  
  /**
   * Perform a health check on all user relays
   */
  async performHealthCheck(): Promise<void> {
    // Check all user relays
    for (const relayUrl of this.userRelays.keys()) {
      if (!this.connectionManager.isConnected(relayUrl)) {
        this.connectionManager.connectToRelay(relayUrl);
      }
    }
  }
  
  /**
   * Update the user relays reference
   * @param userRelays Updated map of user relays
   */
  updateUserRelays(userRelays: Map<string, boolean>): void {
    this.userRelays = userRelays;
  }
  
  /**
   * Stop health checks and clean up
   */
  cleanup(): void {
    if (this.healthCheckInterval !== null) {
      window.clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
