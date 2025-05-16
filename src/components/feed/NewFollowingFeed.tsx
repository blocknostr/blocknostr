import React, { useEffect, useCallback, useState } from "react";
import { nostrService } from "@/lib/nostr";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import NewNoteCard from "../note/NewNoteCard";
import { Loader2, AlertCircle, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { Link } from "react-router-dom";

interface NewFollowingFeedProps {
  activeHashtag?: string;
  onLoadingChange?: (isLoading: boolean) => void;
}

const NewFollowingFeed: React.FC<NewFollowingFeedProps> = ({ 
  activeHashtag,
  onLoadingChange 
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<string[]>([]);
  
  // Set up intersection observer for infinite scroll
  const { observedRef } = useIntersectionObserver({
    onIntersect: () => {
      if (loading || loadingMore || !hasMore) return;
      loadMoreEvents();
    },
    options: {
      rootMargin: '300px',
    },
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

  // Load initial following list
  const loadFollowing = useCallback(async () => {
    try {
      // Use nostrService to get following list
      const followingList = nostrService.following || [];
      setFollowing(followingList);
      return followingList;
    } catch (error) {
      console.error("Error loading following list:", error);
      return [];
    }
  }, []);

  // Load initial events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    setEvents([]);
    
    if (onLoadingChange) onLoadingChange(true);
    
    try {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Get following list
      const followingList = await loadFollowing();
      
      // If no following, return early
      if (followingList.length === 0) {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
        return;
      }
      
      // Create subscription filters
      const filters = [];
      
      if (activeHashtag) {
        // If hashtag is active, filter posts by following + hashtag
        filters.push({
          kinds: [1],
          authors: followingList,
          "#t": [activeHashtag],
          limit: 50
        });
      } else {
        // Otherwise just get posts from following
        filters.push({
          kinds: [1],
          authors: followingList,
          limit: 50
        });
      }
      
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
      
      // Wait for events to come in
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Unsubscribe after timeout
      nostrService.unsubscribe(subId);
      
      // Sort events by created_at (newest first)
      const sortedEvents = collectedEvents.sort((a, b) => b.created_at - a.created_at);
      
      setEvents(sortedEvents);
      
      // Fetch profiles for all collected pubkeys
      if (collectedPubkeys.length > 0) {
        fetchProfiles(collectedPubkeys);
      }
      
      setHasMore(sortedEvents.length >= 30);
    } catch (error) {
      console.error("Error loading following feed:", error);
      setError("Failed to load feed. Please try again later.");
    } finally {
      setLoading(false);
      if (onLoadingChange) onLoadingChange(false);
    }
  }, [activeHashtag, fetchProfiles, loadFollowing, onLoadingChange]);

  // Load more events (older events)
  const loadMoreEvents = async () => {
    if (loadingMore || !hasMore || events.length === 0 || following.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      // Get the oldest event timestamp
      const oldestEvent = events[events.length - 1];
      const until = oldestEvent.created_at - 1;
      
      // Create subscription filters
      const filters = [];
      
      if (activeHashtag) {
        // If hashtag is active, filter posts by following + hashtag
        filters.push({
          kinds: [1],
          authors: following,
          "#t": [activeHashtag],
          until: until,
          limit: 30
        });
      } else {
        // Otherwise just get posts from following
        filters.push({
          kinds: [1],
          authors: following,
          until: until,
          limit: 30
        });
      }
      
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
      
      // Add new events to the list
      setEvents(prev => [...prev, ...sortedEvents]);
      
      // Fetch profiles for all collected pubkeys
      if (collectedPubkeys.length > 0) {
        fetchProfiles(collectedPubkeys);
      }
      
      setHasMore(sortedEvents.length >= 20);
    } catch (error) {
      console.error("Error loading more events:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load events on initial render and when following or hashtags change
  useEffect(() => {
    loadEvents();
  }, [activeHashtag, loadEvents]);

  // If no following, show empty state
  if (!loading && following.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col items-center space-y-2">
            <div className="rounded-full bg-primary/10 p-3">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Follow some users</h3>
            <p className="text-muted-foreground text-center mb-4">
              You're not following anyone yet. Follow some users to see their posts here.
            </p>
            <Link to="/settings">
              <Button>
                Find people to follow
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading && events.length === 0) {
    return (
      <div className="py-8 flex justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">
            Loading posts from people you follow {activeHashtag ? `with #${activeHashtag}` : ''}
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
  if (events.length === 0 && !loading) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {activeHashtag ? 
          `No posts found from people you follow with #${activeHashtag} hashtag` :
          `No posts found from people you follow`
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

export default NewFollowingFeed;
