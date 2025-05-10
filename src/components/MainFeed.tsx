import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({}); 
  const [activeTab, setActiveTab] = useState("global");
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const [since, setSince] = useState<number | undefined>(undefined);
  const [until, setUntil] = useState(Math.floor(Date.now() / 1000));
  const [subId, setSubId] = useState<string | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<NostrEvent[]>([]);
  
  useEffect(() => {
    setFilteredEvents(events);
  }, [events]);

  const loadMoreEvents = () => {
    if (!subId) return;
    
    // Close previous subscription
    if (subId) {
      nostrService.unsubscribe(subId);
    }

    // Create new subscription with older timestamp range
    if (!since) {
      // If no since value yet, get the oldest post timestamp
      const oldestEvent = events.length > 0 ? 
        events.reduce((oldest, current) => oldest.created_at < current.created_at ? oldest : current) : 
        null;
      
      const newUntil = oldestEvent ? oldestEvent.created_at - 1 : until - 24 * 60 * 60;
      const newSince = newUntil - 24 * 60 * 60; // 24 hours before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    } else {
      // We already have a since value, so use it to get older posts
      const newUntil = since;
      const newSince = newUntil - 24 * 60 * 60; // 24 hours before until
      
      setSince(newSince);
      setUntil(newUntil);
      
      // Start the new subscription with the older timestamp range
      const newSubId = setupSubscription(newSince, newUntil);
      setSubId(newSubId);
    }
  };
  
  const {
    loadMoreRef,
    loading,
    setLoading,
    hasMore,
    setHasMore
  } = useInfiniteScroll(loadMoreEvents, { initialLoad: true });

  const setupSubscription = (since: number, until?: number) => {
    // Create filters for the nostr subscription
    let filters: any[] = [
      {
        kinds: [1], // Regular notes
        limit: 20,
        since: since,
        until: until
      },
      {
        kinds: [6], // Reposts
        limit: 20,
        since: since,
        until: until
      }
    ];
    
    // If we have an active hashtag, filter by it
    if (activeHashtag) {
      // Add tag filter
      filters = [
        {
          ...filters[0],
          "#t": [activeHashtag.toLowerCase()]
        },
        {
          ...filters[1], // Keep the reposts filter
        }
      ];
    }

    // Subscribe to text notes and reposts
    const newSubId = nostrService.subscribe(
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

    return newSubId;
  };

  const fetchOriginalPost = (eventId: string) => {
    // Subscribe to a specific event by ID
    const eventSubId = nostrService.subscribe(
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
      nostrService.unsubscribe(eventSubId);
    }, 5000);
  };
  
  const fetchProfileData = (pubkey: string) => {
    const metadataSubId = nostrService.subscribe(
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
      nostrService.unsubscribe(metadataSubId);
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
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
      // Start a new subscription
      const newSubId = setupSubscription(currentTime - 24 * 60 * 60, currentTime);
      setSubId(newSubId);
      setLoading(false);
    };
    
    initFeed();
    
    // Cleanup subscription when component unmounts
    return () => {
      if (subId) {
        nostrService.unsubscribe(subId);
      }
    };
  }, [activeHashtag]);

  // Mark the loading as finished when we get events
  useEffect(() => {
    if (events.length > 0 && loading) {
      setLoading(false);
    }
  }, [events, loading]);

  const handleRetweetStatusChange = (eventId: string, isRetweeted: boolean) => {
    if (!isRetweeted) {
      // Filter out the unreposted event
      setFilteredEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Home</h1>
          {activeHashtag && (
            <div className="flex items-center">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md flex items-center gap-2">
                #{activeHashtag}
                <button 
                  onClick={onClearHashtag} 
                  className="rounded-full hover:bg-primary/20 p-1 transition-colors"
                  title="Clear filter"
                >
                  <X size={14} />
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
      
      <CreateNoteForm />
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <TabsList className={cn(
          "w-full mb-4",
          isMobile ? "grid grid-cols-2" : ""
        )}>
          <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1" 
            disabled={!isLoggedIn}
          >
            Following
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          {activeHashtag && filteredEvents.length === 0 && !loading && (
            <div className="py-4 text-center text-muted-foreground">
              No posts found with #{activeHashtag} hashtag
            </div>
          )}
          
          {loading && filteredEvents.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
            </div>
          ) : filteredEvents.length === 0 && !activeHashtag ? (
            <div className="py-8 text-center text-muted-foreground">
              No posts found. Connect to more relays or follow more people.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map(event => (
                <NoteCard 
                  key={event.id} 
                  event={event} 
                  profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                  repostData={event.id && repostData[event.id] ? {
                    reposterPubkey: repostData[event.id].pubkey,
                    reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                  } : undefined}
                  onRetweetStatusChange={handleRetweetStatusChange}
                />
              ))}
              
              {/* Loading indicator at the bottom */}
              <div ref={loadMoreRef} className="py-4 text-center">
                {loading && filteredEvents.length > 0 && (
                  <div className="text-muted-foreground text-sm">
                    Loading more posts...
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following">
          {!isLoggedIn ? (
            <div className="py-8 text-center text-muted-foreground">
              You need to log in to see posts from people you follow.
            </div>
          ) : (
            <FollowingFeed activeHashtag={activeHashtag} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainFeed;
