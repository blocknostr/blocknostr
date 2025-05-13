
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
}

const FeedList: React.FC<FeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading,
  onRefresh,
  onLoadMore = () => {},
  hasMore = true,
  loadMoreLoading = false
}) => {
  return (
    <OptimizedFeedList
      events={events}
      profiles={profiles}
      repostData={repostData}
      loading={loading}
      onRefresh={onRefresh}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      loadMoreLoading={loadMoreLoading}
    />
  );
};

export default FeedList;
