
import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "./NoteCard";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const [events, setEvents] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [repostData, setRepostData] = useState<Record<string, { pubkey: string, original: NostrEvent }>>({}); 
  const [activeTab, setActiveTab] = useState("global");
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Connect to relays
      await nostrService.connectToUserRelays();
      
      let filters: any[] = [
        {
          kinds: [1], // Regular notes
          limit: 20,
          since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Last 24 hours
        },
        {
          kinds: [6], // Reposts
          limit: 20,
          since: Math.floor(Date.now() / 1000) - 24 * 60 * 60 // Last 24 hours
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
      
      // Reset events when applying a new filter
      setEvents([]);
      setLoading(true);
      
      // Subscribe to text notes (kind 1) and reposts (kind 6)
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
  }, [activeHashtag]);
  
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
          {activeHashtag && events.length === 0 && !loading && (
            <div className="py-4 text-center text-muted-foreground">
              No posts found with #{activeHashtag} hashtag
            </div>
          )}
          
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
            </div>
          ) : events.length === 0 && !activeHashtag ? (
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
                  repostData={event.id && repostData[event.id] ? {
                    reposterPubkey: repostData[event.id].pubkey,
                    reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                  } : undefined}
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
            <FollowingFeed activeHashtag={activeHashtag} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainFeed;
