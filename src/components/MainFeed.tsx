
import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MainFeed = () => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("global");
  const isLoggedIn = !!nostrService.publicKey;
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      // Subscribe to text notes (kind 1)
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1],
            limit: 20,
            since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Last 24 hours
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
  }, []);
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-4">
        <h1 className="text-xl font-bold">Home</h1>
      </div>
      
      <CreateNoteForm />
      
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={setActiveTab}
        className="mt-4"
      >
        <TabsList className="w-full mb-4">
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
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading posts...
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No posts found. Connect to more relays or follow more people.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <NoteCard 
                  key={event.id} 
                  event={event} 
                  profileData={event.pubkey ? profiles[event.pubkey] : undefined} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="following">
          {!isLoggedIn ? (
            <div className="py-8 text-center text-muted-foreground">
              You need to log in to see posts from people you follow.
            </div>
          ) : (
            <FollowingFeed />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainFeed;
