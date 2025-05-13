
import { NostrEvent } from "@/lib/nostr";

export type ProfileLoadingStatus = 'idle' | 'loading' | 'success' | 'error';

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

export interface ProfileLoadingState {
  metadata: ProfileLoadingStatus;
  posts: ProfileLoadingStatus;
  relations: ProfileLoadingStatus;
  relays: ProfileLoadingStatus;
  reactions: ProfileLoadingStatus;
}
