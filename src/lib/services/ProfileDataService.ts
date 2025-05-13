
import { NostrEvent, nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr";
import { BrowserEventEmitter } from "./BrowserEventEmitter";
import { eventBus, EVENTS } from "./EventBus";
import { ProfileData, ProfileLoadingState, ProfileMetadata } from "./profile/types";
import { ProfileMetadataService } from "./profile/profile-metadata-service";
import { ProfilePostsService } from "./profile/profile-posts-service";
import { ProfileRelationsService } from "./profile/profile-relations-service";
import { ProfileRelaysService } from "./profile/profile-relays-service";
import { ProfileReactionsService } from "./profile/profile-reactions-service";
import { ProfileDataManager } from "./profile/profile-data-manager";

/**
 * ProfileDataService centralizes all profile data loading and management
 * to improve performance and reliability
 */
export class ProfileDataService extends BrowserEventEmitter {
  private static instance: ProfileDataService;
  
  private currentPubkey: string | null = null;
  private isMounted = true;
  
  // Service modules
  private metadataService: ProfileMetadataService;
  private postsService: ProfilePostsService;
  private relationsService: ProfileRelationsService;
  private relaysService: ProfileRelaysService;
  private reactionsService: ProfileReactionsService;
  private dataManager: ProfileDataManager;
  
  // Private constructor for singleton pattern
  private constructor() {
    super();
    
    // Initialize service modules
    this.metadataService = new ProfileMetadataService(this);
    this.postsService = new ProfilePostsService(this);
    this.relationsService = new ProfileRelationsService(this);
    this.relaysService = new ProfileRelaysService(this);
    this.reactionsService = new ProfileReactionsService(this);
    this.dataManager = new ProfileDataManager(this);
    
    // Handle events from modules to update the central data store
    this.on('post-received', (pubkey, event) => {
      this.dataManager.addProfilePost(pubkey, event);
    });
    
    this.on('media-received', (pubkey, event) => {
      this.dataManager.addProfileMediaPost(pubkey, event);
    });
    
    // Listen for relay connection changes
    window.addEventListener('relay-connected', this.refreshActiveData);
    window.addEventListener('relay-disconnected', this.refreshActiveData);
    
    // Clean up expired cache entries periodically
    this.startCacheCleanup();
    
    // Set up event handling for profile data updates
    this.setupEventHandling();
  }
  
  public static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService();
    }
    return ProfileDataService.instance;
  }
  
  private startCacheCleanup(): void {
    setInterval(() => {
      this.dataManager.cleanupCache();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
  
  private setupEventHandling(): void {
    // Listen for profile update events from other services
    eventBus.on(EVENTS.PROFILE_UPDATED, (pubkey: string, profileData: any) => {
      if (pubkey === this.currentPubkey) {
        this.dataManager.updateProfileMetadata(pubkey, profileData);
      }
    });
  }
  
  /**
   * Refresh data for currently viewed profile
   */
  private refreshActiveData = (): void => {
    if (this.currentPubkey) {
      this.metadataService.loadMetadata(
        this.currentPubkey, 
        this.dataManager.getLoadingStatus(this.currentPubkey) as Record<string, any>
      );
      this.postsService.loadPosts(
        this.currentPubkey,
        this.dataManager.getLoadingStatus(this.currentPubkey) as Record<string, any>
      );
    }
  }
  
  /**
   * Load profile data optimized for performance
   * - First loads metadata (highest priority)
   * - Then loads posts in parallel with social data
   * - Uses caching aggressively
   */
  public async loadProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<ProfileData> {
    // Convert npub to hex if needed
    let hexPubkey = this.dataManager.getPubkeyFromNpub(npub);
    if (!hexPubkey && currentUserPubkey) {
      hexPubkey = currentUserPubkey;
    }
    
    // If no valid pubkey, return empty data
    if (!hexPubkey) {
      console.warn("No valid pubkey provided");
      return this.dataManager.getEmptyProfileData(null, false);
    }
    
    // Track current pubkey for refresh operations
    this.currentPubkey = hexPubkey;
    this.dataManager.setCurrentPubkey(hexPubkey);
    
    // Get or initialize profile data
    const isCurrentUser = hexPubkey === currentUserPubkey;
    const profileData = this.dataManager.getOrCreateProfileData(hexPubkey, isCurrentUser);
    
    // Ensure we're connected to relays
    await this.metadataService.connectToOptimalRelays();
    
    // Launch priority loading - metadata first
    this.metadataService.loadMetadata(
      hexPubkey, 
      this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>
    );
    
    // Launch parallel data loading
    setTimeout(() => {
      const loadingStatus = this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>;
      if (!loadingStatus) return;
      
      Promise.all([
        this.postsService.loadPosts(hexPubkey, loadingStatus),
        this.relationsService.loadRelations(hexPubkey, isCurrentUser, loadingStatus),
        this.relaysService.loadRelays(hexPubkey, isCurrentUser, loadingStatus),
        this.reactionsService.loadReactions(hexPubkey, loadingStatus)
      ]).catch(err => console.error("Error in parallel profile data loading:", err));
    }, 100);
    
    return profileData;
  }
  
  /**
   * Force refresh all data for a profile
   */
  public async refreshProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<void> {
    let hexPubkey = this.dataManager.getPubkeyFromNpub(npub);
    if (!hexPubkey && currentUserPubkey) {
      hexPubkey = currentUserPubkey;
    }
    
    if (!hexPubkey) return;
    
    const loadingStatus = this.dataManager.getLoadingStatus(hexPubkey);
    if (!loadingStatus) return;
    
    // Reset loading state
    const resetStatus = {
      metadata: 'idle',
      posts: 'idle',
      relations: 'idle',
      relays: 'idle',
      reactions: 'idle'
    };
    
    Object.assign(loadingStatus, resetStatus);
    this.emit('loading-state-changed', hexPubkey, loadingStatus);
    
    // Ensure relay connection
    await this.metadataService.connectToOptimalRelays();
    
    // Reload all data
    await this.metadataService.loadMetadata(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>);
    
    Promise.all([
      this.postsService.loadPosts(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.relationsService.loadRelations(hexPubkey, hexPubkey === currentUserPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.relaysService.loadRelays(hexPubkey, hexPubkey === currentUserPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>),
      this.reactionsService.loadReactions(hexPubkey, this.dataManager.getLoadingStatus(hexPubkey) as Record<string, any>)
    ]).catch(err => console.error("Error in parallel profile data refresh:", err));
  }
  
  /**
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    return this.dataManager.getLoadingStatus(pubkey);
  }
  
  /**
   * Clean up when service is no longer needed
   */
  public dispose(): void {
    this.isMounted = false;
    window.removeEventListener('relay-connected', this.refreshActiveData);
    window.removeEventListener('relay-disconnected', this.refreshActiveData);
    
    // Clean up subscriptions and references
    this.removeAllListeners();
    this.currentPubkey = null;
    this.dataManager.setCurrentPubkey(null);
  }
}

// Export singleton instance
export const profileDataService = ProfileDataService.getInstance();

// Re-export types
export type { ProfileData, ProfileLoadingState, ProfileMetadata };
