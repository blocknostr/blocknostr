
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

// Add the missing CacheCheckResult interface
export interface CacheCheckResult {
  postsEvents: NostrEvent[];
  mediaEvents: NostrEvent[];
  foundInCache: boolean;
}

// Update UsePostsSubscriptionProps interface
export interface UsePostsSubscriptionProps {
  onEvent: (event: NostrEvent, isMediaEvent: boolean) => void;
  onComplete: () => void;
  limit: number;
  componentId?: string; // Add component ID for subscription tracking
}
