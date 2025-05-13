import React, { useEffect, useMemo } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../note/MemoizedNoteCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInView } from "../shared/useInView";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import { useUnifiedProfileFetcher } from "@/hooks/useUnifiedProfileFetcher";

// Define a stricter type for profiles
interface ProfileData {
  pubkey: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  website?: string;
  nip05?: string;
  lud16?: string;
  [key: string]: unknown;
}

interface OptimizedFeedListProps {
  events: NostrEvent[];
  profiles: Record<string, ProfileData>;
  repostData: Record<string, { pubkey: string; original: NostrEvent }>;
  loading: boolean;
  onRefresh?: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadMoreLoading?: boolean;
}

const OptimizedFeedList: React.FC<OptimizedFeedListProps> = ({
  events,
  profiles: initialProfiles,
  repostData,
  loading,
  onRefresh,
  onLoadMore,
  hasMore,
  loadMoreLoading = false
}) => {
  // Use our custom hook for intersection observer
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Use our unified profile fetcher
  const { profiles: unifiedProfiles, fetchProfiles } = useUnifiedProfileFetcher();

  // Combine initial profiles with unified profiles using useMemo to avoid unnecessary re-renders
  const combinedProfiles = useMemo(
    () => ({ ...initialProfiles, ...unifiedProfiles }),
    [initialProfiles, unifiedProfiles]
  );

  // Fetch profiles for authors that aren't already loaded
  useEffect(() => {
    if (events.length > 0) {
      const pubkeysToFetch = new Set<string>();

      // Add authors
      events.forEach(event => {
        if (event.pubkey && !combinedProfiles[event.pubkey]) {
          pubkeysToFetch.add(event.pubkey);
        }
      });

      // Add reposters
      Object.values(repostData).forEach(data => {
        if (data.pubkey && !combinedProfiles[data.pubkey]) {
          pubkeysToFetch.add(data.pubkey);
        }
      });

      if (pubkeysToFetch.size > 0) {
        fetchProfiles(Array.from(pubkeysToFetch));
      }
    }
  }, [events, repostData, combinedProfiles, fetchProfiles]);

  // Load more content when the load more element comes into view
  useEffect(() => {
    if (inView && hasMore && !loadMoreLoading) {
      onLoadMore();
    }
  }, [inView, hasMore, loadMoreLoading, onLoadMore]);

  if (loading && events.length === 0) {
    return <FeedLoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-4">
      {/* Optional refresh button */}
      {onRefresh && (
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Refresh Feed
          </Button>
        </div>
      )}

      {/* Staggered rendering for improved perceived performance */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={event.id || index}>
            <div
              className="animate-fade-in"
              style={{
                animationDelay: `${Math.min(index * 50, 500)}ms`,
                animationFillMode: 'both'
              }}
            >
              <NoteCard
                event={event}
                profileData={event.pubkey ? combinedProfiles[event.pubkey] : undefined}
                repostData={
                  event.id && repostData[event.id]
                    ? {
                      reposterPubkey: repostData[event.id].pubkey,
                      reposterProfile: repostData[event.id].pubkey
                        ? combinedProfiles[repostData[event.id].pubkey]
                        : undefined
                    }
                    : undefined
                }
              />
            </div>
          </div>
        ))}

        {/* Loading indicator at the bottom that triggers more content */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 text-center">
            {loadMoreLoading && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more posts...
              </div>
            )}
          </div>
        )}

        {/* End of feed message */}
        {!hasMore && events.length > 0 && (
          <div className="text-center py-8 text-muted-foreground border-t">
            You've reached the end of your feed
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedFeedList;