
import { NostrEvent } from "@/lib/nostr";

/**
 * Profile metadata structure
 */
export interface ProfileMetadata {
  name?: string;
  display_name?: string;
  picture?: string;
  banner?: string;
  website?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
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
 * Combined profile data structure
 */
export interface ProfileData {
  pubkey: string;
  npub: string;
  metadata: ProfileMetadata | null;
  posts: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  replies: NostrEvent[];
  reactions: NostrEvent[];
  followers: string[];
  following: string[];
  relays: any[];
  referencedEvents: Record<string, NostrEvent>;
  isCurrentUser: boolean;
  loadingState: ProfileLoadingState;
}
