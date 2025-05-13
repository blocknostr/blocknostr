import { nostrService } from "@/lib/nostr";
import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { ProfileData, ProfileLoadingState, ProfileMetadata } from "./types";
import { NostrEvent } from "@/lib/nostr";

/**
 * Manages the central profile data store
 */
export class ProfileDataManager {
  private emitter: BrowserEventEmitter;
  private profileDataStore: Map<string, ProfileData> = new Map();
  private currentPubkey: string | null = null;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listen for profile data updates
    this.emitter.on('metadata-received', (pubkey: string, metadata: any) => {
      this.updateProfileMetadata(pubkey, metadata);
    });
    
    this.emitter.on('followers-received', (pubkey: string, followers: string[]) => {
      const profileData = this.getOrCreateProfileData(pubkey);
      profileData.followers = followers;
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    });
    
    this.emitter.on('following-received', (pubkey: string, following: string[]) => {
      const profileData = this.getOrCreateProfileData(pubkey);
      profileData.following = following;
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    });
    
    this.emitter.on('relays-received', (pubkey: string, relays: any[]) => {
      const profileData = this.getOrCreateProfileData(pubkey);
      profileData.relays = relays;
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    });
    
    this.emitter.on('reactions-received', (pubkey: string, reactions: NostrEvent[]) => {
      const profileData = this.getOrCreateProfileData(pubkey);
      profileData.reactions = reactions;
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    });
  }
  
  private emitDataChange(pubkey: string): void {
    const profileData = this.profileDataStore.get(pubkey);
    if (profileData) {
      this.emitter.emit('profile-data-changed', pubkey, profileData);
    }
  }
  
  /**
   * Update profile metadata
   */
  public updateProfileMetadata(pubkey: string, metadata: ProfileMetadata | null): void {
    const profileData = this.getOrCreateProfileData(pubkey);
    profileData.metadata = metadata;
    this.profileDataStore.set(pubkey, profileData);
    this.emitDataChange(pubkey);
  }
  
  /**
   * Add a post to the profile data
   */
  public addProfilePost(pubkey: string, event: NostrEvent): void {
    const profileData = this.getOrCreateProfileData(pubkey);
    
    // Only add unique posts
    if (!profileData.posts.some(post => post.id === event.id)) {
      profileData.posts.push(event);
      
      // Sort posts by created_at in descending order (newest first)
      profileData.posts.sort((a, b) => b.created_at - a.created_at);
      
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    }
  }
  
  /**
   * Add a media post to the profile data
   */
  public addProfileMediaPost(pubkey: string, event: NostrEvent): void {
    const profileData = this.getOrCreateProfileData(pubkey);
    
    // Only add unique media posts
    if (!profileData.media.some(post => post.id === event.id)) {
      profileData.media.push(event);
      
      // Sort media by created_at in descending order (newest first)
      profileData.media.sort((a, b) => b.created_at - a.created_at);
      
      this.profileDataStore.set(pubkey, profileData);
      this.emitDataChange(pubkey);
    }
  }
  
  /**
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    const profileData = this.profileDataStore.get(pubkey);
    return profileData?.loadingState || null;
  }
  
  /**
   * Get or create a profile data object
   */
  public getOrCreateProfileData(pubkey: string, isCurrentUser = false): ProfileData {
    let profileData = this.profileDataStore.get(pubkey);
    
    if (!profileData) {
      // Create empty profile data structure with default loading state
      profileData = this.getEmptyProfileData(pubkey, isCurrentUser);
      this.profileDataStore.set(pubkey, profileData);
    }
    
    return profileData;
  }
  
  /**
   * Create an empty profile data object with default values
   */
  public getEmptyProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
    const hexPubkey = pubkey || '';
    const npub = hexPubkey ? nostrService.getNpubFromHex(hexPubkey) : '';
    
    return {
      pubkey: hexPubkey,
      npub,
      metadata: null,
      posts: [],
      media: [],
      reposts: [],
      replies: [],
      reactions: [],
      followers: [],
      following: [],
      relays: [],
      referencedEvents: {},
      isCurrentUser,
      loadingState: {
        metadata: 'idle',
        posts: 'idle',
        relations: 'idle',
        relays: 'idle',
        reactions: 'idle'
      }
    };
  }
  
  /**
   * Get pubkey from npub
   */
  public getPubkeyFromNpub(npub: string | undefined): string | null {
    if (!npub) return null;
    
    try {
      return nostrService.getHexFromNpub(npub);
    } catch (error) {
      console.error("Invalid npub:", error);
      return null;
    }
  }
  
  /**
   * Set current pubkey
   */
  public setCurrentPubkey(pubkey: string | null): void {
    this.currentPubkey = pubkey;
  }
  
  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    // In a real implementation, this would remove old entries
    // For now, we just do basic cleanup
    
    // Only keep the current pubkey and a few recent ones
    if (this.profileDataStore.size > 10) {
      const keysToKeep = new Set<string>();
      
      // Always keep current pubkey
      if (this.currentPubkey) {
        keysToKeep.add(this.currentPubkey);
      }
      
      // Get all keys sorted by access time (not implemented here)
      const allKeys = Array.from(this.profileDataStore.keys());
      
      // Keep only the first 10 keys
      allKeys.slice(0, 10).forEach(key => keysToKeep.add(key));
      
      // Remove all other keys
      this.profileDataStore.forEach((_, key) => {
        if (!keysToKeep.has(key)) {
          this.profileDataStore.delete(key);
        }
      });
    }
  }
}
