import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { NostrEvent } from '@/lib/nostr/types';
import NewNoteCard from '@/components/note/NewNoteCard';
import { ArticleNoteCard } from '@/components/articles/ArticleCard';
import { Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux';
import { profileApi } from '@/api/rtk/profileApi';

interface VirtualizedFeedProps {
  events: NostrEvent[];
  profiles?: Record<string, any>;
  metrics?: Record<string, { likes: number; replies: number; reposts: number; views?: number; }>;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  height?: number;
  className?: string;
}

/**
 * High-performance virtualized feed component
 * ✅ NOW SUPPORTS: Both regular notes and articles with consistent dimensions
 * ✅ USES: Profile data from feed to prevent duplicate API calls
 * ✅ NEW: Metrics data for real engagement statistics
 */
const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({
  events,
  profiles = {},
  metrics = {},
  onLoadMore,
  hasMore,
  loadingMore,
  height = 600,
  className = '',
}) => {
  const dispatch = useAppDispatch();
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  
  // ✅ Helper function to determine event type
  const getEventType = (event: NostrEvent): 'note' | 'article' => {
    // Articles typically use kind 30023 or have specific tags
    if (event.kind === 30023 || event.tags.some(tag => tag[0] === 'title')) {
      return 'article';
    }
    return 'note';
  };
  
  // ✅ IMPROVED: Use RTK Query for better profile prefetching
  const prefetchVisibleProfiles = useCallback((startIndex: number, endIndex: number) => {
    const visibleEvents = events.slice(startIndex, endIndex + 5); // Prefetch a few extra
    const pubkeys = [...new Set(visibleEvents.map(event => event.pubkey))];
    
    // Use RTK Query prefetch which handles deduplication automatically
    pubkeys.forEach(pubkey => {
      dispatch(profileApi.util.prefetch('getProfile', pubkey, { force: false }));
    });
  }, [events, dispatch]);

  // Prefetch profiles when visible range changes
  useEffect(() => {
    prefetchVisibleProfiles(visibleRange.start, visibleRange.end);
  }, [visibleRange, prefetchVisibleProfiles]);

  // Memoize item count for infinite loader
  const itemCount = useMemo(() => {
    return hasMore ? events.length + 1 : events.length;
  }, [events.length, hasMore]);

  // Check if item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !!events[index];
  }, [events]);

  // ✅ ENHANCED: Support both notes and articles with consistent dimensions
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = events[index];
    
    // Loading indicator for the last item when loading more
    if (!event) {
      return (
        <div style={style} className="flex items-center justify-center py-8">
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more posts...
          </div>
        </div>
      );
    }

    // ✅ EXTRACT PROFILE DATA: Handle both nested and flattened metadata structures
    const profile = profiles[event.pubkey];
    const profileData = profile ? {
      // Check both nested metadata and flattened structures for compatibility
      displayName: profile?.metadata?.display_name || 
                   profile?.metadata?.name || 
                   profile?.display_name || 
                   profile?.name || 
                   `User ${event.pubkey.slice(0,8)}`,
      picture: profile?.metadata?.picture || 
               profile?.metadata?.image || 
               profile?.picture || 
               profile?.image || 
               '',
      hasData: !!profile
    } : undefined;

    // ✅ Determine event type and render appropriate component
    const eventType = getEventType(event);
    
    return (
      <div style={style} className="border-b border-border/50 last:border-b-0">
        <div className="px-4 py-1 h-full overflow-hidden">
          <div className="h-[268px] overflow-hidden">
            <React.Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse bg-muted rounded-lg w-full h-32" />
              </div>
            }>
              {eventType === 'article' ? (
                <ArticleNoteCard 
                  article={event}
                  profileData={profileData} 
                  metrics={metrics[event.id]}
                  className="border-0 shadow-none bg-transparent hover:bg-muted/30 h-full"
                />
              ) : (
                <NewNoteCard 
                  event={event}
                  profileData={profileData} 
                  className="border-0 shadow-none bg-transparent hover:bg-muted/30 h-full"
                />
              )}
            </React.Suspense>
          </div>
        </div>
      </div>
    );
  }, [events, profiles, metrics]);

  return (
    <div className="w-full" style={{ height: height }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={onLoadMore}
        threshold={5}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={height}
            itemCount={itemCount}
            itemSize={280} // Consistent size for both notes and articles
            onItemsRendered={onItemsRendered}
            overscanCount={2}
            className="scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
          >
            {Row}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};

export default React.memo(VirtualizedFeed); 

