import { BrowserEventEmitter } from "../BrowserEventEmitter";
import { ProfileData, ProfileLoadingState } from "./types";
import { nostrService } from "@/lib/nostr";

/**
 * Manages profile data across the application
 */
export class ProfileDataManager {
  private emitter: BrowserEventEmitter;
  private profileData: Record<string, ProfileData> = {};
  private loadingStatus: Record<string, ProfileLoadingState> = {};
  private currentPubkey: string | null = null;
  
  constructor(emitter: BrowserEventEmitter) {
    this.emitter = emitter;
  }
  
  /**
   * Get pubkey from npub or return the input if already a hex pubkey
   */
  public getPubkeyFromNpub(npub: string | undefined): string | null {
    if (!npub) return null;
    
    try {
      // If it's an npub, convert to hex
      if (npub.startsWith('npub')) {
        return nostrService.getHexFromNpub(npub);
      }
      
      // Otherwise assume it's already a hex pubkey
      return npub;
    } catch (error) {
      console.error("Invalid pubkey format:", error);
      return null;
    }
  }
  
  /**
   * Get or create profile data for a pubkey
   */
  public getOrCreateProfileData(pubkey: string, isCurrentUser: boolean): ProfileData {
    if (!this.profileData[pubkey]) {
      // Initialize empty profile data
      this.profileData[pubkey] = this.getEmptyProfileData(pubkey, isCurrentUser);
      
      // Initialize loading status
      this.loadingStatus[pubkey] = {
        metadata: 'idle',
        posts: 'idle',
        relations: 'idle',
        relays: 'idle',
        reactions: 'idle'
      };
    }
    
    return this.profileData[pubkey];
  }
  
  /**
   * Get empty profile data structure
   */
  public getEmptyProfileData(pubkey: string | null, isCurrentUser: boolean): ProfileData {
    return {
      pubkey: pubkey || '',
      npub: pubkey ? nostrService.getNpubFromHex(pubkey) : '',
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
   * Get loading status for a profile
   */
  public getLoadingStatus(pubkey: string): ProfileLoadingState | null {
    return this.loadingStatus[pubkey] || null;
  }
  
  /**
   * Set current pubkey being viewed
   */
  public setCurrentPubkey(pubkey: string | null): void {
    this.currentPubkey = pubkey;
  }
  
  /**
   * Update profile metadata
   */
  public updateProfileMetadata(pubkey: string, metadata: any): void {
    if (!this.profileData[pubkey]) return;
    
    this.profileData[pubkey].metadata = metadata;
    this.emitter.emit('profile-data-changed', pubkey, this.profileData[pubkey]);
  }
  
  /**
   * Add a post to a profile's posts list
   */
  public addProfilePost(pubkey: string, post: any): void {
    if (!this.profileData[pubkey]) return;
    
    // Check if post already exists
    if (!this.profileData[pubkey].posts.some(p => p.id === post.id)) {
      this.profileData[pubkey].posts.push(post);
      this.profileData[pubkey].posts.sort((a, b) => b.created_at - a.created_at);
      this.emitter.emit('profile-data-changed', pubkey, this.profileData[pubkey]);
    }
  }
  
  /**
   * Add a media post to a profile
   */
  public addProfileMediaPost(pubkey: string, post: any): void {
    if (!this.profileData[pubkey]) return;
    
    // Check if media post already exists
    if (!this.profileData[pubkey].media.some(p => p.id === post.id)) {
      this.profileData[pubkey].media.push(post);
      this.profileData[pubkey].media.sort((a, b) => b.created_at - a.created_at);
      this.emitter.emit('profile-data-changed', pubkey, this.profileData[pubkey]);
    }
  }
  
  /**
   * Clean up cache
   */
  public cleanupCache(): void {
    // Implement cache cleanup logic if needed
  }
}
