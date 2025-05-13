import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { ProfileData, ProfileLoadingState } from "./types";
import { cacheManager } from "@/lib/utils/cacheManager";
import { nostrService } from "@/lib/nostr";

/**
 * Manages profile data storage and caching
 */
export class ProfileDataManager {
  private eventEmitter: BrowserEventEmitter;
  private profiles: Record<string, ProfileData> = {};
  private loadingStatus: Record<string, ProfileLoadingState> = {};
  
  constructor(eventEmitter: BrowserEventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Get cached or initialize basic profile data
   */
  public getOrCreateProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
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
  public getEmptyProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
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
   * Get profile data by pubkey
   */
  public getProfileData(pubkey: string | null): ProfileData | null {
    if (!pubkey) return null;
    return this.profiles[pubkey] || null;
  }
  
  /**
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    return this.loadingStatus[pubkey] || null;
  }
  
  /**
   * Update profile metadata
   */
  public updateProfileMetadata(pubkey: string, metadata: any): void {
    if (!this.profiles[pubkey]) return;
    
    this.profiles[pubkey].metadata = metadata;
    this.eventEmitter.emit('metadata-updated', pubkey, metadata);
  }
  
  /**
   * Update profile posts
   */
  public updateProfilePosts(pubkey: string, posts: any[]): void {
    if (!this.profiles[pubkey]) return;
    
    this.profiles[pubkey].posts = posts;
    this.eventEmitter.emit('posts-updated', pubkey, posts);
  }
  
  /**
   * Add a new post to profile
   */
  public addProfilePost(pubkey: string, event: any): void {
    if (!this.profiles[pubkey]) return;
    
    // Check if we already have this event
    if (this.profiles[pubkey].posts.some(e => e.id === event.id)) {
      return;
    }
    
    // Add to posts array and sort by created_at (newest first)
    this.profiles[pubkey].posts = [
      event,
      ...this.profiles[pubkey].posts
    ].sort((a, b) => b.created_at - a.created_at);
    
    this.eventEmitter.emit('posts-updated', pubkey, this.profiles[pubkey].posts);
  }
  
  /**
   * Add a new media post to profile
   */
  public addProfileMediaPost(pubkey: string, event: any): void {
    if (!this.profiles[pubkey]) return;
    
    // Check if we already have this event
    if (this.profiles[pubkey].media.some(e => e.id === event.id)) {
      return;
    }
    
    // Add to media array and sort by created_at (newest first)
    this.profiles[pubkey].media = [
      event,
      ...this.profiles[pubkey].media
    ].sort((a, b) => b.created_at - a.created_at);
    
    this.eventEmitter.emit('media-updated', pubkey, this.profiles[pubkey].media);
  }
  
  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    console.log("Cleaning up profile data cache...");
    // Remove profiles that haven't been accessed for 10+ minutes
    for (const pubkey of Object.keys(this.profiles)) {
      const lastAccessed = cacheManager.get<number>(`profile_accessed_${pubkey}`);
      if (!lastAccessed || (Date.now() - lastAccessed > 10 * 60 * 1000)) {
        delete this.profiles[pubkey];
        delete this.loadingStatus[pubkey];
      }
    }
  }
  
  /**
   * Get pubkey from npub
   */
  public getPubkeyFromNpub(npub: string | undefined): string | null {
    if (!npub) return null;
    
    try {
      // If npub is already in hex format (64 chars)
      if (npub.length === 64 && /^[0-9a-f]+$/i.test(npub)) {
        return npub;
      }
      
      // If npub starts with 'npub1', convert to hex
      if (npub.startsWith('npub1')) {
        return nostrService.getHexFromNpub(npub);
      } 
      
      // Otherwise assume it's already hex
      return npub;
    } catch (error) {
      console.error("Invalid pubkey format:", error);
      return null;
    }
  }
}
