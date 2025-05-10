import { useEffect, useState } from "react";
import { NostrEvent, nostrService, type SubCloser } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed = ({ activeHashtag }: FollowingFeedProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({}); 
  const following = nostrService.following;
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [subHandle, setSubHandle] = useState<SubCloser | null>(null);
  
  const loadMoreEvents = () => {
    if (!subHandle || following.length === 0) return;
    
    // Close previous subscription
    if (subHandle) {
      nostrService.unsubscribe(subHandle);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubHandle = setupSubscription(newSince, newUntil);
      setSubHandle(newSubHandle);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60 * 7; // 7 days before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubHandle = setupSubscription(newSince, newUntil);
      setSubHandle(newSubHandle);
    }
  };
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  const setupSubscription = (since: number, until?: number): SubCloser | null => {
    if (following.length === 0) {
      setLoading(false);
      return null;
    }
    
    // Create filters for followed users
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        authors: following,
        limit: 50,
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        authors: following,
        limit: 20,
        since: since,
        until: until
      }
    ];
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      filters = [
        {
          ...filters[0],
          "#t": [activeHashtag.toLowerCase()]
        },
        {
          ...filters[1] // Keep the reposts filter
        }
      ];
    }
    
    // Subscribe to events
    const newSubHandle = nostrService.subscribe(
      filters,
      (event) => {
        if (event.kind === 1) {
          // Regular note
          setEvents(prev => {
            // Check if we already have this event
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            const newEvents = [...prev, event];
            
            // Sort by creation time (newest first)
            newEvents.sort((a, b) => b.created_at - a.created_at);
            
            // If we've reached the limit, set hasMore to false
            if (newEvents.length >= 100) {
              setHasMore(false);
            }
            
            return newEvents;
          });
        }
        else if (event.kind === 6) {
          // Repost - extract the referenced event
          try {
            // Some clients store the original event in content as JSON
            const content = JSON.parse(event.content);
            
            if (content.event && content.event.id) {
              const originalEventId = content.event.id;
              const originalEventPubkey = content.event.pubkey;
              
              // Track repost data for later display
              setRepostData(prev => ({
                ...prev,
                [originalEventId]: { 
                  pubkey: event.pubkey,  // The reposter
                  original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
                }
              }));
              
              // Fetch the original post
              fetchOriginalPost(originalEventId);
            }
          } catch (e) {
            // If parsing fails, try to get event reference from tags
            const eventReference = event.tags.find(tag => tag[0] === 'e');
            if (eventReference && eventReference[1]) {
              const originalEventId = eventReference[1];
              
              // Find pubkey reference
              const pubkeyReference = event.tags.find(tag => tag[0] === 'p');
              const originalEventPubkey = pubkeyReference ? pubkeyReference[1] : null;
              
              // Track repost data
              setRepostData(prev => ({
                ...prev,
                [originalEventId]: { 
                  pubkey: event.pubkey,  // The reposter
                  original: { id: originalEventId, pubkey: originalEventPubkey } as NostrEvent
                }
              }));
              
              // Fetch the original post
              fetchOriginalPost(originalEventId);
            }
          }
        }
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    return newSubHandle;
  };
  
  const fetchOriginalPost = (eventId: string) => {
    // Subscribe to a specific event by ID
    const eventSubHandle = nostrService.subscribe(
      [
        {
          ids: [eventId],
          kinds: [1]
        }
      ],
      (event) => {
        setEvents(prev => {
          // Check if we already have this event
          if (prev.some(e => e.id === event.id)) {
            return prev;
          }
          
          // Add new event and sort by creation time (newest first)
          return [...prev, event].sort((a, b) => b.created_at - a.created_at);
        });
        
        // Fetch profile data for this pubkey if we don't have it yet
        if (event.pubkey && !profiles[event.pubkey]) {
          fetchProfileData(event.pubkey);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(eventSubHandle);
    }, 5000);
  };
  
  const fetchProfileData = (pubkey: string) => {
    const metadataSubHandle = nostrService.subscribe(
      [
        {
          kinds: [0],
          authors: [pubkey],
          limit: 1
        }
      ],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [pubkey]: metadata
          }));
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(metadataSubHandle);
    }, 5000);
  };
  
  useEffect(() => {
    const initFeed = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Reset state when filter changes
      setEvents([]);
      setHasMore(true);
      setLoading(true);
      
      // Reset the timestamp range for new subscription
      const currentTime = Math.floor(Date.now() / 1000);
      setSince(undefined);
      setUntil(currentTime);
      
      // Close previous subscription if exists
      if (subHandle) {
        nostrService.unsubscribe(subHandle);
      }
      
      // Start a new subscription
      const newSubHandle = setupSubscription(currentTime - 24 * 60 * 60 * 7, currentTime);
      setSubHandle(newSubHandle);
      
      if (following.length === 0) {
        setLoading(false);
      }
    };
    
    initFeed();
    
    return () => {
      if (subHandle) {
        nostrService.unsubscribe(subHandle);
      }
    };
  }, [following, activeHashtag]);
  
  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);
  
  return (
    <div>
      {activeHashtag && events.length === 0 && !loading && (
        <div className="py-4 text-center text-muted-foreground">
          No posts found with #{activeHashtag} hashtag from people you follow
        </div>
      )}
      
      {loading && events.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''} from people you follow...
        </div>
      ) : events.length === 0 && !activeHashtag ? (
        <div className="py-8 text-center text-muted-foreground">
          {following.length > 0 
            ? "No posts from people you follow yet. Try following more users or connecting to more relays."
            : "You're not following anyone yet. Follow some users to see their posts here."}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <NoteCard 
              key={event.id} 
              event={event} 
              profileData={event.pubkey ? profiles[event.pubkey] : undefined}
              repostData={event.id && repostData[event.id] ? {
                reposterPubkey: repostData[event.id].pubkey,
                reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
              } : undefined}
            />
          ))}
          
          {/* Loading indicator at the bottom */}
          <div ref={loadMoreRef} className="py-4 text-center">
            {loading && events.length > 0 && (
              <div className="text-muted-foreground text-sm">
                Loading more posts...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowingFeed;
