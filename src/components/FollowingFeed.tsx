
import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import { toast } from "sonner";

interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed = ({ activeHashtag }: FollowingFeedProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({}); 
  const following = nostrService.following;
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      if (following.length === 0) {
        setLoading(false);
        return;
      }
      
      // Create filters for followed users
      let filters: any[] = [
        {
          kinds: [1], // Regular notes
          authors: following,
          limit: 50,
          since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 7 // Last week
        },
        {
          kinds: [6], // Reposts
          authors: following,
          limit: 20,
          since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 7 // Last week
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
      
      // Reset events when applying a new filter
      setEvents([]);
      
      // Subscribe to text notes (kind 1) and reposts (kind 6) from followed users
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          if (event.kind === 1) {
            // Regular note
            setEvents(prev => {
              // Check if we already have this event
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              
              // Add new event and sort by creation time (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
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
      
      setLoading(false);
      
      return () => {
        nostrService.unsubscribe(subId);
      };
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
    
    fetchEvents();
  }, [following, activeHashtag]);
  
  return (
    <div>
      {activeHashtag && events.length === 0 && !loading && (
        <div className="py-4 text-center text-muted-foreground">
          No posts found with #{activeHashtag} hashtag from people you follow
        </div>
      )}
      
      {loading ? (
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
        </div>
      )}
    </div>
  );
};

export default FollowingFeed;
