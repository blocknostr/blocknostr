
import { NostrEvent } from '@/lib/nostr';

export interface UseProfilePostsProps {
  hexPubkey: string | undefined;
  limit?: number;
}

export interface UseProfilePostsReturn {
  events: NostrEvent[];
  media: NostrEvent[];
  loading: boolean;
  error: string | null;
  hasEvents: boolean;
  refetch: () => void;
}

export interface CacheCheckResult {
  postsEvents: NostrEvent[];
  mediaEvents: NostrEvent[];
  foundInCache: boolean;
}
