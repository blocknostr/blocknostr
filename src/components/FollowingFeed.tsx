
import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import { toast } from "sonner";

const FollowingFeed = () => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const following = nostrService.following;
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      if (following.length === 0) {
        setLoading(false);
        return;
      }
      
      // Subscribe to text notes (kind 1) from followed users
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1],
            authors: following,
            limit: 50,
            since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 * 7 // Last week
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
      
      setLoading(false);
      
      return () => {
        nostrService.unsubscribe(subId);
      };
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
  }, [following]);
  
  return (
    <div>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading posts from people you follow...
        </div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {following.length > 0 
            ? "No posts from people you follow yet. Try following more users or connecting to more relays."
            : "You're not following anyone yet. Follow some users to see their posts here."}
        </div>
      ) : (
        <div>
          {events.map(event => (
            <NoteCard 
              key={event.id} 
              event={event} 
              profileData={event.pubkey ? profiles[event.pubkey] : undefined} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingFeed;
