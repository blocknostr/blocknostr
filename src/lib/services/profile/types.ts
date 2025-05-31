import { NostrEvent } from "@/lib/nostr";

/**
 * Profile metadata structure (NIP-01 compatible)
 */
export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  website?: string;
  about?: string;
  lud16?: string;
  created_at?: number;
  [key: string]: any;
}

/**
 * Loading state for profile data components
 */
export type ProfileLoadingState = {
  metadata: 'idle' | 'loading' | 'success' | 'error';
  posts: 'idle' | 'loading' | 'success' | 'error';
  relations: 'idle' | 'loading' | 'success' | 'error';
  relays: 'idle' | 'loading' | 'success' | 'error';
  reactions: 'idle' | 'loading' | 'success' | 'error';
}

/**
 * UNIFIED ProfileData interface - Single source of truth
 * Combines both simple and complex profile data needs
 */
export interface ProfileData {
  // Core identity
  pubkey: string;
  npub?: string; // Optional npub representation
  
  // Profile metadata (simplified access)
  displayName?: string;
  name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  lud16?: string;
  website?: string;
  
  // Computed social data
  isFollowing?: boolean;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  lastSeen?: number;
  createdAt?: number;
  
  // Enhanced social graph
  mutualConnections?: number;
  influenceScore?: number;
  
  // Complex data (for advanced features)
  metadata?: ProfileMetadata | null;
  posts?: NostrEvent[];
  media?: NostrEvent[];
  reposts?: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  followers?: string[];
  following?: string[];
  relays?: any[];
  referencedEvents?: Record<string, NostrEvent>;
  
  // State management
  isCurrentUser?: boolean;
  loadingState?: ProfileLoadingState;
}

