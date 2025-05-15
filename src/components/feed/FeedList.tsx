
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import OptimizedFeedList from "./OptimizedFeedList";

interface FeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  loading: boolean;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadMoreLoading?: boolean;
  isEagerLoading?: boolean;
  partialLoaded?: boolean;
}

// Simplified FeedList component that directly passes props to OptimizedFeedList
const FeedList: React.FC<FeedListProps> = (props) => {
  return <OptimizedFeedList {...props} />;
};

export default FeedList;
