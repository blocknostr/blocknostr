
import { useEffect, useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Loader2 } from "lucide-react";

const BookmarksPage = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<NostrEvent[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrService.publicKey;
  
  // Fetch bookmarks on mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }
      
      try {
        const bookmarkIds = await nostrService.getBookmarks();
        setBookmarks(bookmarkIds);
        
        if (bookmarkIds.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
        setLoading(false);
      }
    };
    
    fetchBookmarks();
  }, [isLoggedIn]);
  
  // Fetch bookmarked events
  useEffect(() => {
    if (bookmarks.length === 0) return;
    
    const fetchEvents = async () => {
      try {
        await nostrService.connectToUserRelays();
        
        const subId = nostrService.subscribe(
          [
            {
              ids: bookmarks,
              kinds: [1], // Regular notes
            }
          ],
          (event) => {
            setBookmarkedEvents(prev => {
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              return [...prev, event];
            });
            
            // Fetch profile data for this event
            if (event.pubkey && !profiles[event.pubkey]) {
              fetchProfileData(event.pubkey);
            }
          }
        );
        
        // Set a timeout to close the subscription
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setLoading(false);
        }, 5000);
        
        return () => {
          nostrService.unsubscribe(subId);
        };
      } catch (error) {
        console.error("Error fetching bookmarked events:", error);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [bookmarks]);
  
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
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-xl font-bold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your saved notes appear here
        </p>
      </div>
      
      {!isLoggedIn ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            You need to log in to see your bookmarks
          </p>
        </div>
      ) : loading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-muted-foreground">Loading bookmarks...</span>
        </div>
      ) : bookmarkedEvents.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No bookmarks yet. Click the bookmark icon on any post to save it here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarkedEvents
            .sort((a, b) => b.created_at - a.created_at)
            .map(event => (
              <NoteCard 
                key={event.id} 
                event={event} 
                profileData={profiles[event.pubkey]}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
