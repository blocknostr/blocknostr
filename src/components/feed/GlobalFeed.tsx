import React, { useEffect, useCallback, useState, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import NewNoteCard from "../note/NewNoteCard";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";
import FeedList from "./FeedList";
import FeedLoading from "./FeedLoading";

interface GlobalFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const GlobalFeed: React.FC<GlobalFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});  
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extendedLoading, setExtendedLoading] = useState(true);
  const [showRetry, setShowRetry] = useState(false);
  const [repostData, setRepostData] = useState<Record<string, any>>({});
  const { preferences } = useUserPreferences();
  const initialLoadDone = useRef(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Default hashtags if none set
  const defaultGlobalTags = ["bitcoin", "alephium", "ergo"];

  // Get the hashtags to filter by - either the active hashtag, user preferences, or default ones
  const hashtags = activeHashtag 
    ? [activeHashtag] 
    : (preferences.feedFilters?.globalFeedTags?.length 
        ? preferences.feedFilters.globalFeedTags 
        : defaultGlobalTags);
        
  // Function to fetch profiles for events
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (pubkeys.length === 0) return;
    
    try {
      const profiles = await nostrService.getProfilesByPubkeys(pubkeys);
      setProfiles(prev => ({ ...prev, ...profiles }));
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  }, []);

  // Fetch events for global feed using the properly implemented method
  const fetchEvents = useCallback(async (since?: number, until?: number) => {
    try {
      // For hashtag filtering, we need to use specific filters
      const filter: any = { 
        kinds: [1], // Note kind
        limit: 20
      };
      
      // Add timestamp filters for pagination if provided
      if (since) filter.since = since;
      if (until) filter.until = until;
      
      // Add hashtag filtering if needed
      if (hashtags && hashtags.length > 0) {
        // For every hashtag, we need to search for '#hashtag' in the content
        // or look for 't' tag with the hashtag value
        filter.t = hashtags;
      }
        // Get notes from relays
      const notes = await new Promise<any[]>((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log('Fetch timed out, returning empty result');
          resolve([]);
        }, 10000);
        
        nostrService.queryEvents([filter])
          .then(events => {
            clearTimeout(timeoutId);
            resolve(events || []);
          })
          .catch(err => {
            console.error('Error fetching events:', err);
            clearTimeout(timeoutId);
            resolve([]);
          });
      });
      
      if (notes && notes.length > 0) {
        // Extract unique authors for profile fetching
        const authors = [...new Set(notes.map(note => note.pubkey))];
        await fetchProfiles(authors);
      }
      
      return notes;
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      return [];
    }
  }, [hashtags, fetchProfiles]);

  // Initial load
  useEffect(() => {
    const loadInitialEvents = async () => {
      setLoading(true);
      setError(null);
      setEvents([]);
      
      try {
        const newEvents = await fetchEvents();
        setEvents(newEvents);
        setHasMore(newEvents.length >= 20);
      } catch (error) {
        console.error('Error loading initial events:', error);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
        initialLoadDone.current = true;
      }
    };
    
    loadInitialEvents();
    
    // Listen for refresh events
    const handleRefresh = () => {
      loadInitialEvents();
    };
    
    window.addEventListener('refetch-global-feed', handleRefresh);
    
    return () => {
      window.removeEventListener('refetch-global-feed', handleRefresh);
    };
  }, [fetchEvents]);
  
  // Function to load more events for infinite scrolling
  const loadMoreEvents = async () => {
    if (loadingMore || !hasMore || events.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      // Get the oldest event timestamp for pagination
      const oldestEvent = events[events.length - 1];
      const until = oldestEvent.created_at;
      
      // Fetch older events
      const olderEvents = await fetchEvents(undefined, until - 1);
      
      if (olderEvents.length > 0) {
        setEvents(prev => [...prev, ...olderEvents]);
        setHasMore(olderEvents.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more events:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Notify parent component of loading state changes
  useEffect(() => {
    // Update loading state via callback if provided
    if (onLoadingChange) {
      onLoadingChange(loading || extendedLoading);
    }
    
    // Dispatch custom event for global notification of loading state changes
    // This allows components that don't have direct prop connection to react
    window.dispatchEvent(new CustomEvent('feed-loading-change', { 
      detail: { isLoading: loading || extendedLoading }
    }));
    
  }, [loading, extendedLoading, onLoadingChange]);
  
  // Reset extended loading state when activeHashtag changes
  useEffect(() => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Set a longer timeout for showing retry button
    const timeout = setTimeout(() => {
      setExtendedLoading(false);
      if (events.length === 0 && !loading) {
        setShowRetry(true);
      }
    }, 7000); // 7 seconds timeout before showing retry
    
    return () => clearTimeout(timeout);
  }, [activeHashtag, loading]);
  
  // Update showRetry when events or loading state changes
  useEffect(() => {
    if (!extendedLoading && events.length === 0 && !loading) {
      setShowRetry(true);
    } else if (events.length > 0 || loading) {
      setShowRetry(false);
    }
  }, [events, loading, extendedLoading]);
  
  const handleRetry = () => {
    setExtendedLoading(true);
    setShowRetry(false);
    
    // Force component to re-evaluate its logic
    const event = new CustomEvent('refetch-global-feed');
    window.dispatchEvent(event);
    
    // Set timeout to show retry again if still no events after 7 seconds
    setTimeout(() => {
      setExtendedLoading(false);
    }, 7000);
  };

  // Show loading state when no events and loading or in extended loading period
  if ((loading || extendedLoading) && events.length === 0) {
    return (
      <div style={{ overscrollBehavior: 'contain' }}>
        <FeedLoading activeHashtag={activeHashtag} />
      </div>
    );
  }
  
  // Show retry button when no events and not loading, after extended loading period
  if (events.length === 0 && showRetry) {
    return (
      <div className="py-8 text-center flex flex-col items-center" style={{ overscrollBehavior: 'contain' }}>
        <div className="mb-3">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
        </div>
        <p className="text-muted-foreground mb-4">
          {activeHashtag ? 
            `No posts found with #${activeHashtag} hashtag` :
            "No posts found. Connect to more relays to see posts here."
          }
        </p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }
  
  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground" style={{ overscrollBehavior: 'contain' }}>
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag` :
          "No posts found. Connect to more relays to see posts here."
        }
      </div>
    );
  }

  // Show events list
  return (
    <div style={{ overscrollBehavior: 'contain' }}>
      <FeedList 
        events={events}
        profiles={profiles}
        repostData={repostData}
        loadMoreRef={loadMoreRef}
        loading={loading}
        onLoadMore={loadMoreEvents}
        hasMore={hasMore}
        loadMoreLoading={loadingMore}
      />
    </div>
  );
};

export default GlobalFeed;
