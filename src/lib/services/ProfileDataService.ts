import { NostrEvent, nostrService } from "@/lib/nostr";
import { contentCache } from "@/lib/nostr";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";
import { retry } from "@/lib/utils/retry";
import { cacheManager } from "@/lib/utils/cacheManager";
import { BrowserEventEmitter } from "./BrowserEventEmitter";

type ProfileLoadingStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
  nip05?: string;
  about?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  created_at?: number;
  [key: string]: any;
}

export interface ProfileData {
  metadata: ProfileMetadata | null;
  posts: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  replies: NostrEvent[];
  reactions: NostrEvent[];
  referencedEvents: Record<string, NostrEvent>;
  followers: any[];
  following: any[];
  relays: any[];
  originalPostProfiles: Record<string, any>;
  isCurrentUser: boolean;
  hexPubkey: string | null;
}

interface ProfileLoadingState {
  metadata: ProfileLoadingStatus;
  posts: ProfileLoadingStatus;
  relations: ProfileLoadingStatus;
  relays: ProfileLoadingStatus;
  reactions: ProfileLoadingStatus;
}

/**
 * ProfileDataService centralizes all profile data loading and management
 * to improve performance and reliability
 */
export class ProfileDataService extends BrowserEventEmitter {
  private static instance: ProfileDataService;
  
  private currentPubkey: string | null = null;
  private profiles: Record<string, ProfileData> = {};
  private loadingStatus: Record<string, ProfileLoadingState> = {};
  private isMounted = true;
  
  // Private constructor for singleton pattern
  private constructor() {
    super();
    
    // Listen for relay connection changes
    window.addEventListener('relay-connected', this.refreshActiveData);
    window.addEventListener('relay-disconnected', this.refreshActiveData);
    
    // Clean up expired cache entries periodically
    this.startCacheCleanup();
  }
  
  public static getInstance(): ProfileDataService {
    if (!ProfileDataService.instance) {
      ProfileDataService.instance = new ProfileDataService();
    }
    return ProfileDataService.instance;
  }
  
  private startCacheCleanup(): void {
    setInterval(() => {
      console.log("Cleaning up profile data cache...");
      // Remove profiles that haven't been accessed for 10+ minutes
      for (const pubkey of Object.keys(this.profiles)) {
        const lastAccessed = cacheManager.get<number>(`profile_accessed_${pubkey}`);
        if (!lastAccessed || (Date.now() - lastAccessed > 10 * 60 * 1000)) {
          delete this.profiles[pubkey];
          delete this.loadingStatus[pubkey];
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }
  
  /**
   * Get cached or initialize basic profile data
   */
  private getOrCreateProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
    if (!pubkey) {
      return this.getEmptyProfileData(pubkey, isCurrentUser);
    }
    
    if (!this.profiles[pubkey]) {
      this.profiles[pubkey] = this.getEmptyProfileData(pubkey, isCurrentUser);
      
      // Initialize loading state
      this.loadingStatus[pubkey] = {
        metadata: 'idle',
        posts: 'idle',
        relations: 'idle',
        relays: 'idle',
        reactions: 'idle'
      };
    }
    
    // Mark as accessed for cache management
    cacheManager.set(`profile_accessed_${pubkey}`, Date.now(), 30 * 60 * 1000);
    
    return this.profiles[pubkey];
  }
  
  /**
   * Create empty profile data structure
   */
  private getEmptyProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
    return {
      metadata: null,
      posts: [],
      media: [],
      reposts: [],
      replies: [],
      reactions: [],
      referencedEvents: {},
      followers: [],
      following: [],
      relays: [],
      originalPostProfiles: {},
      isCurrentUser,
      hexPubkey: pubkey
    };
  }
  
  /**
   * Load profile data optimized for performance
   * - First loads metadata (highest priority)
   * - Then loads posts in parallel with social data
   * - Uses caching aggressively
   */
  public async loadProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<ProfileData> {
    // Convert npub to hex if needed
    let hexPubkey: string | null = null;
    
    try {
      if (npub) {
        // If npub is already in hex format (64 chars)
        if (npub.length === 64 && /^[0-9a-f]+$/i.test(npub)) {
          hexPubkey = npub;
          console.log("Using existing hex pubkey:", hexPubkey);
        }
        // If npub starts with 'npub1', convert to hex
        else if (npub.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(npub);
          console.log("Converting npub to hex:", npub, "->", hexPubkey);
        } 
        // Otherwise assume it's already hex
        else {
          hexPubkey = npub;
          console.log("Using provided pubkey as hex:", hexPubkey);
        }
      } else if (currentUserPubkey) {
        hexPubkey = currentUserPubkey;
        console.log("Using current user's pubkey:", hexPubkey);
      }
    } catch (error) {
      console.error("Invalid pubkey format:", error);
      return this.getEmptyProfileData(null, false);
    }
    
    // If no valid pubkey, return empty data
    if (!hexPubkey) {
      console.warn("No valid pubkey provided");
      return this.getEmptyProfileData(null, false);
    }
    
    // Track current pubkey for refresh operations
    this.currentPubkey = hexPubkey;
    
    // Get or initialize profile data
    const isCurrentUser = hexPubkey === currentUserPubkey;
    const profileData = this.getOrCreateProfileData(hexPubkey, isCurrentUser);
    
    // Ensure we're connected to relays
    await this.connectToOptimalRelays();
    
    // Launch priority loading - metadata first
    this.loadMetadata(hexPubkey);
    
    // Launch parallel data loading
    setTimeout(() => {
      Promise.all([
        this.loadPosts(hexPubkey),
        this.loadRelations(hexPubkey, isCurrentUser),
        this.loadRelays(hexPubkey, isCurrentUser),
        this.loadReactions(hexPubkey)
      ]).catch(err => console.error("Error in parallel profile data loading:", err));
    }, 100);
    
    return profileData;
  }
  
  /**
   * Refresh data for currently viewed profile
   */
  private refreshActiveData = (): void => {
    if (this.currentPubkey) {
      this.loadMetadata(this.currentPubkey);
      this.loadPosts(this.currentPubkey);
    }
  }
  
  /**
   * Handle relay connections intelligently
   */
  private async connectToOptimalRelays(): Promise<void> {
    try {
      // First ensure connection to user's configured relays
      await nostrService.connectToUserRelays();
      
      // Add popular general relays
      const popularRelays = [
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band",
        "wss://relay.snort.social"
      ];
      
      // Select best relays for reading
      const bestRelays = relaySelector.selectBestRelays(popularRelays, { 
        operation: 'read', 
        count: 3 
      });
      
      await nostrService.addMultipleRelays(bestRelays);
    } catch (error) {
      console.error("Error connecting to relays:", error);
    }
  }
  
  /**
   * Load profile metadata with priority
   */
  private async loadMetadata(pubkey: string): Promise<void> {
    if (!pubkey || !this.profiles[pubkey]) return;
    
    // Skip if already loading
    if (this.loadingStatus[pubkey].metadata === 'loading') return;
    
    this.loadingStatus[pubkey].metadata = 'loading';
    this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    
    try {
      // Check cache first
      let profile = contentCache.getProfile(pubkey);
      
      if (!profile) {
        // Retry pattern for reliable loading
        profile = await retry(async () => {
          return nostrService.getUserProfile(pubkey);
        }, {
          maxAttempts: 2,
          baseDelay: 1000
        });
        
        // Cache profile if found
        if (profile) {
          contentCache.cacheProfile(pubkey, profile, true);
        }
      }
      
      if (profile && this.profiles[pubkey]) {
        // Update profile data
        this.profiles[pubkey].metadata = profile;
        this.loadingStatus[pubkey].metadata = 'success';
        
        // Notify listeners
        this.emit('metadata-updated', pubkey, profile);
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      } else {
        this.loadingStatus[pubkey].metadata = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    } catch (error) {
      console.error(`Error loading profile metadata for ${pubkey}:`, error);
      if (this.profiles[pubkey]) {
        this.loadingStatus[pubkey].metadata = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Load user posts
   */
  private async loadPosts(pubkey: string): Promise<void> {
    if (!pubkey || !this.profiles[pubkey]) return;
    
    // Skip if already loading
    if (this.loadingStatus[pubkey].posts === 'loading') return;
    
    this.loadingStatus[pubkey].posts = 'loading';
    this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    
    // Check cache first
    const cachedEvents = contentCache.getEventsByAuthors([pubkey]);
    if (cachedEvents && cachedEvents.length > 0) {
      this.processPostEvents(pubkey, cachedEvents);
    }
    
    try {
      // Create subscription for posts
      const notesSubId = nostrService.subscribe(
        [
          {
            kinds: [1],
            authors: [pubkey],
            limit: 50
          }
        ],
        (event) => this.handlePostEvent(pubkey, event)
      );
      
      // Auto-close subscription after timeout
      setTimeout(() => {
        nostrService.unsubscribe(notesSubId);
        
        if (this.profiles[pubkey] && this.loadingStatus[pubkey].posts === 'loading') {
          this.loadingStatus[pubkey].posts = 
            this.profiles[pubkey].posts.length > 0 ? 'success' : 'error';
          this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
        }
      }, 10000);
    } catch (error) {
      console.error(`Error loading posts for ${pubkey}:`, error);
      if (this.profiles[pubkey]) {
        this.loadingStatus[pubkey].posts = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Process and categorize post events
   */
  private processPostEvents(pubkey: string, events: NostrEvent[]): void {
    if (!this.profiles[pubkey]) return;
    
    // Sort by newest first
    const sortedEvents = [...events].sort((a, b) => b.created_at - a.created_at);
    
    // Process regular posts (kind 1)
    const posts = sortedEvents.filter(e => e.kind === 1);
    
    // Extract media posts
    const media = posts.filter(event => {
      const mediaUrls = this.extractMediaUrls(event);
      return mediaUrls.length > 0;
    });
    
    // Update profile data
    this.profiles[pubkey].posts = posts;
    this.profiles[pubkey].media = media;
    
    // Mark as successful if we got posts
    if (posts.length > 0 && this.loadingStatus[pubkey]) {
      this.loadingStatus[pubkey].posts = 'success';
      this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    }
    
    // Notify listeners
    this.emit('posts-updated', pubkey, posts);
    this.emit('media-updated', pubkey, media);
  }
  
  /**
   * Extract media URLs from a post
   */
  private extractMediaUrls(event: NostrEvent): string[] {
    if (!event.content) return [];
    
    const urlRegex = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?)/g;
    const matches = event.content.match(urlRegex) || [];
    
    // Also check for image tags
    if (event.tags && Array.isArray(event.tags)) {
      const imageTags = event.tags
        .filter(tag => tag[0] === 'image' || tag[0] === 'media')
        .map(tag => tag[1])
        .filter(url => !!url);
      
      return [...matches, ...imageTags];
    }
    
    return matches;
  }
  
  /**
   * Handle incoming post events from subscription
   */
  private handlePostEvent(pubkey: string, event: NostrEvent): void {
    if (!this.profiles[pubkey]) return;
    
    try {
      // Check if we already have this event
      if (this.profiles[pubkey].posts.some(e => e.id === event.id)) {
        return;
      }
      
      // Cache the event
      contentCache.cacheEvent(event);
      
      // Add to posts array
      this.profiles[pubkey].posts = [
        event,
        ...this.profiles[pubkey].posts
      ].sort((a, b) => b.created_at - a.created_at);
      
      // Check if it's media
      const mediaUrls = this.extractMediaUrls(event);
      if (mediaUrls.length > 0) {
        this.profiles[pubkey].media = [
          event,
          ...this.profiles[pubkey].media
        ].sort((a, b) => b.created_at - a.created_at);
        
        this.emit('media-updated', pubkey, this.profiles[pubkey].media);
      }
      
      // Notify listeners
      this.emit('posts-updated', pubkey, this.profiles[pubkey].posts);
      
      // Mark as successful
      this.loadingStatus[pubkey].posts = 'success';
      this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    } catch (error) {
      console.error("Error handling post event:", error);
    }
  }
  
  /**
   * Load followers and following data
   */
  private async loadRelations(pubkey: string, isCurrentUser: boolean): Promise<void> {
    if (!pubkey || !this.profiles[pubkey]) return;
    
    // Skip if already loading
    if (this.loadingStatus[pubkey].relations === 'loading') return;
    
    this.loadingStatus[pubkey].relations = 'loading';
    this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    
    try {
      // Just initialize empty arrays for now
      // A full implementation would fetch this data from relays
      this.profiles[pubkey].followers = [];
      this.profiles[pubkey].following = [];
      
      this.loadingStatus[pubkey].relations = 'success';
      this.emit('relations-updated', pubkey, {
        followers: this.profiles[pubkey].followers,
        following: this.profiles[pubkey].following
      });
      this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    } catch (error) {
      console.error(`Error loading relations for ${pubkey}:`, error);
      if (this.profiles[pubkey]) {
        this.loadingStatus[pubkey].relations = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Load relay preferences
   */
  private async loadRelays(pubkey: string, isCurrentUser: boolean): Promise<void> {
    if (!pubkey || !this.profiles[pubkey]) return;
    
    // Skip if already loading
    if (this.loadingStatus[pubkey].relays === 'loading') return;
    
    this.loadingStatus[pubkey].relays = 'loading';
    this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    
    try {
      // For current user, get relay status
      if (isCurrentUser) {
        const relayStatus = nostrService.getRelayStatus();
        this.profiles[pubkey].relays = relayStatus;
      } else {
        // For other users, fetch relay preferences
        // This would normally be implemented by getting relay lists
        this.profiles[pubkey].relays = [];
      }
      
      this.loadingStatus[pubkey].relays = 'success';
      this.emit('relays-updated', pubkey, this.profiles[pubkey].relays);
      this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    } catch (error) {
      console.error(`Error loading relays for ${pubkey}:`, error);
      if (this.profiles[pubkey]) {
        this.loadingStatus[pubkey].relays = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Load user's reactions
   */
  private async loadReactions(pubkey: string): Promise<void> {
    if (!pubkey || !this.profiles[pubkey]) return;
    
    // Skip if already loading
    if (this.loadingStatus[pubkey].reactions === 'loading') return;
    
    this.loadingStatus[pubkey].reactions = 'loading';
    this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    
    try {
      // Initialize with empty data
      this.profiles[pubkey].reactions = [];
      this.profiles[pubkey].referencedEvents = {};
      
      this.loadingStatus[pubkey].reactions = 'success';
      this.emit('reactions-updated', pubkey, {
        reactions: this.profiles[pubkey].reactions,
        referencedEvents: this.profiles[pubkey].referencedEvents
      });
      this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
    } catch (error) {
      console.error(`Error loading reactions for ${pubkey}:`, error);
      if (this.profiles[pubkey]) {
        this.loadingStatus[pubkey].reactions = 'error';
        this.emit('loading-state-changed', pubkey, this.loadingStatus[pubkey]);
      }
    }
  }
  
  /**
   * Force refresh all data for a profile
   */
  public async refreshProfileData(npub: string | undefined, currentUserPubkey: string | null): Promise<void> {
    let hexPubkey: string | null = null;
    
    try {
      if (npub) {
        // If npub is already in hex format (64 chars)
        if (npub.length === 64 && /^[0-9a-f]+$/i.test(npub)) {
          hexPubkey = npub;
          console.log("Using existing hex pubkey:", hexPubkey);
        }
        // If npub starts with 'npub1', convert to hex
        else if (npub.startsWith('npub1')) {
          hexPubkey = nostrService.getHexFromNpub(npub);
          console.log("Converting npub to hex:", npub, "->", hexPubkey);
        } 
        // Otherwise assume it's already hex
        else {
          hexPubkey = npub;
          console.log("Using provided pubkey as hex:", hexPubkey);
        }
      } else if (currentUserPubkey) {
        hexPubkey = currentUserPubkey;
        console.log("Using current user's pubkey:", hexPubkey);
      }
    } catch (error) {
      console.error("Invalid pubkey format:", error);
      return;
    }
    
    if (!hexPubkey || !this.profiles[hexPubkey]) return;
    
    // Reset loading state
    if (this.loadingStatus[hexPubkey]) {
      this.loadingStatus[hexPubkey] = {
        metadata: 'idle',
        posts: 'idle',
        relations: 'idle',
        relays: 'idle',
        reactions: 'idle'
      };
      this.emit('loading-state-changed', hexPubkey, this.loadingStatus[hexPubkey]);
    }
    
    // Ensure relay connection
    await this.connectToOptimalRelays();
    
    // Reload all data
    await this.loadMetadata(hexPubkey);
    
    Promise.all([
      this.loadPosts(hexPubkey),
      this.loadRelations(hexPubkey, hexPubkey === currentUserPubkey),
      this.loadRelays(hexPubkey, hexPubkey === currentUserPubkey),
      this.loadReactions(hexPubkey)
    ]).catch(err => console.error("Error in parallel profile data refresh:", err));
  }
  
  /**
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    return this.loadingStatus[pubkey] || null;
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
  }
}

// Export singleton instance
export const profileDataService = ProfileDataService.getInstance();
