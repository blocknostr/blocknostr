
import React, { useEffect, useCallback, useState, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import NewNoteCard from "../note/NewNoteCard";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface NewGlobalFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const NewGlobalFeed: React.FC<NewGlobalFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { preferences } = useUserPreferences();
  const initialLoadDone = useRef(false);

  // Default hashtags if none set
  const defaultGlobalTags = ["bitcoin", "alephium", "ergo"];

  // Get the hashtags to filter by - either the active hashtag, user preferences, or default ones
  const hashtags = activeHashtag 
    ? [activeHashtag] 
    : (preferences.feedFilters?.globalFeedTags?.length 
        ? preferences.feedFilters.globalFeedTags 
        : defaultGlobalTags);
  
  // Set up intersection observer for infinite scroll
  const { observedRef } = useIntersectionObserver({
    onIntersect: () => {
      if (loading || loadingMore || !hasMore) return;
      loadMoreEvents();
    },
    rootMargin: '300px',
    enabled: !loading && !loadingMore && hasMore
  });

  // Function to fetch profiles for events
  const fetchProfiles = useCallback(async (pubkeys: string[]) => {
    if (pubkeys.length === 0) return;
    
    const uniquePubkeys = [...new Set(pubkeys)].filter(p => !profiles[p]);
    if (uniquePubkeys.length === 0) return;

    try {
      const fetchedProfiles = await nostrService.getProfilesByPubkeys(uniquePubkeys);
      setProfiles(prev => ({ ...prev, ...fetchedProfiles }));
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  }, [profiles]);

  // Helper to merge new events with existing ones
  const mergeEvents = useCallback((newEvents: any[], currentEvents: any[]) => {
    // Create a set of existing IDs for quick lookup
    const existingIds = new Set(currentEvents.map(e => e.id));
    
    // Filter out duplicates
    const uniqueNewEvents = newEvents.filter(e => !existingIds.has(e.id));
    
    // Merge and sort
    return [...currentEvents, ...uniqueNewEvents]
      .sort((a, b) => b.created_at - a.created_at);
  }, []);

  // Load initial events
  const loadEvents = useCallback(async () => {
    const wasEmpty = events.length === 0;
    if (wasEmpty) {
      setLoading(true);
    }
    setError(null);
    
    if (onLoadingChange && wasEmpty) {
      onLoadingChange(true);
    }
    
    try {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Create subscription for hashtag events
      const filters = hashtags.map(tag => ({
        kinds: [1], // Text notes only
        "#t": [tag],
        limit: 20
      }));
      
      // Empty array to collect events
      const collectedEvents: any[] = [];
      const collectedPubkeys: string[] = [];
      
      // Create subscription
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          // Don't add duplicates
          if (!collectedEvents.some(e => e.id === event.id)) {
            collectedEvents.push(event);
            if (event.pubkey) {
              collectedPubkeys.push(event.pubkey);
            }
          }
        }
      );
      
      // Wait for initial events to come in (shorter initial timeout)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // If we have any events, update state while keeping subscription open
      if (collectedEvents.length > 0) {
        // Sort events by created_at (newest first)
        const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
        
        // Update events - merge with existing if any
        setEvents(prev => wasEmpty ? sortedEvents : mergeEvents(sortedEvents, prev));
        
        // Fetch profiles for collected pubkeys
        if (collectedPubkeys.length > 0) {
          fetchProfiles(collectedPubkeys);
        }
        
        setHasMore(collectedEvents.length >= 10);
        
        // Update loading states
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
      
      // Wait a bit longer for more events
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Unsubscribe after timeout
      nostrService.unsubscribe(subId);
      
      // Final update with all collected events
      if (collectedEvents.length > 0) {
        // Sort events by created_at (newest first)
        const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
        
        // Update events - merge with existing if any
        setEvents(prev => mergeEvents(sortedEvents, prev));
      }
      
      initialLoadDone.current = true;
    } catch (error) {
      console.error("Error loading global feed:", error);
      setError("Failed to load feed. Please try again later.");
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [hashtags, fetchProfiles, onLoadingChange, events.length, mergeEvents]);

  // Load more events (older events)
  const loadMoreEvents = async () => {
    if (loadingMore || !hasMore || events.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      // Get the oldest event timestamp
      const oldestEvent = events[events.length - 1];
      const until = oldestEvent.created_at - 1;
      
      // Create subscription for older hashtag events
      const filters = hashtags.map(tag => ({
        kinds: [1],
        "#t": [tag],
        until: until,
        limit: 20
      }));
      
      // Empty array to collect events
      const collectedEvents: any[] = [];
      const collectedPubkeys: string[] = [];
      
      // Create subscription
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          // Don't add duplicates or events newer than our oldest event
          if (
            !collectedEvents.some(e => e.id === event.id) &&
            !events.some(e => e.id === event.id) &&
            event.created_at < until
          ) {
            collectedEvents.push(event);
            if (event.pubkey) {
              collectedPubkeys.push(event.pubkey);
            }
          }
        }
      );
      
      // Wait for events to come in
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Unsubscribe after timeout
      nostrService.unsubscribe(subId);
      
      // Sort events by created_at (newest first)
      const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
      
      // Add new events to the list - use merge function
      if (sortedEvents.length > 0) {
        setEvents(prev => mergeEvents(sortedEvents, prev));
      }
      
      // Fetch profiles for all collected pubkeys
      if (collectedPubkeys.length > 0) {
        fetchProfiles(collectedPubkeys);
      }
      
      setHasMore(sortedEvents.length >= 10);
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load events on initial render and when hashtags change
  useEffect(() => {
    loadEvents();
    
    // Listen for refetch events
    const handleRefetch = () => {
      loadEvents();
    };
    
    window.addEventListener('refetch-global-feed', handleRefetch);
    return () => {
      window.removeEventListener('refetch-global-feed', handleRefetch);
    };
  }, [hashtags, loadEvents]);

  // Show loading state when no events and loading
  if (loading && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            Loading posts with {activeHashtag ? `#${activeHashtag}` : hashtags.map(t => `#${t}`).join(", ")}
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && events.length === 0) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadEvents}
          className="mx-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Show empty state when no events and not loading
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found with #${activeHashtag} hashtag` :
          `No posts found with hashtags: ${hashtags.map(t => `#${t}`).join(", ")}`
        }
      </div>
    );
  }

  // Show events list
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <NewNoteCard 
          key={event.id} 
          event={event}
          profileData={profiles[event.pubkey]}
        />
      ))}
      
      {/* Load more trigger */}
      <div 
        ref={observedRef}
        className="py-4 text-center"
      >
        {loadingMore ? (
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading more posts...
          </div>
        ) : hasMore ? (
          <p className="text-sm text-muted-foreground">Scroll for more</p>
        ) : (
          <p className="text-sm text-muted-foreground">No more posts</p>
        )}
      </div>
    </div>
  );
};

export default NewGlobalFeed;
