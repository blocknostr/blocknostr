
import { NostrEvent } from '@/lib/nostr';

export interface UseProfilePostsProps {
  hexPubkey: string | undefined;
  limit?: number;
  componentId?: string; // Add component ID for subscription tracking
}

export interface UseProfilePostsReturn {
  events: NostrEvent[] | null;
  media: NostrEvent[] | null;
  loading: boolean;
  error: string | null;
  hasEvents: boolean;
  refetch: () => void;
}

export interface PostsSubscriptionOptions {
  limit?: number;
  onEvent: (event: NostrEvent, isMediaEvent: boolean) => void;
  onComplete: () => void;
  componentId?: string; // Add component ID for subscription tracking
}
