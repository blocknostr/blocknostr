
import { SimplePool } from 'nostr-tools';
import { EventManager } from './event';
import { CommunityManager } from './community';
import { SocialManager } from './social';
import { RelayManager } from './relay';
import { CommunityService } from './services/community-service';

/**
 * Main Nostr service that coordinates all Nostr-related functionality
 */
export class NostrService {
  private pool: SimplePool;
  private eventManager: EventManager;
  private communityManager: CommunityManager;
  private socialManager: SocialManager;
  private relayManager: RelayManager;
  
  // Services
  private communityService: CommunityService;
  
  // User state
  private publicKey: string | null = null;
  private privateKey: string | null = null;
  
  constructor() {
    this.pool = new SimplePool();
    this.eventManager = new EventManager();
    this.communityManager = new CommunityManager(this.eventManager);
    this.socialManager = new SocialManager();
    this.relayManager = new RelayManager(this.pool);
    
    // Initialize services
    this.initializeServices();
  }
  
  /**
   * Initialize all services
   */
  private initializeServices(): void {
    this.initializeCommunityService();
  }
  
  /**
   * Initialize community service
   */
  initializeCommunityService() {
    this.communityService = new CommunityService(
      this.communityManager,
      () => this.getConnectedRelayUrls(),
      this.pool,
      this.publicKey,
      () => this.privateKey // Pass the getPrivateKey function
    );
  }
  
  /**
   * Set the user's public key
   */
  setPublicKey(publicKey: string | null): void {
    this.publicKey = publicKey;
    
    // Reinitialize services with new public key
    this.initializeServices();
  }
  
  /**
   * Set the user's private key
   */
  setPrivateKey(privateKey: string | null): void {
    this.privateKey = privateKey;
    
    // No need to reinitialize services as they use a getter function
  }
  
  /**
   * Get the user's public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }
  
  /**
   * Get connected relay URLs
   */
  getConnectedRelayUrls(): string[] {
    if (!this.relayManager) return [];
    return this.relayManager.getConnectedRelays().map(relay => relay.url);
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pool.close();
  }
}

// Create and export a singleton instance
export const nostrService = new NostrService();
