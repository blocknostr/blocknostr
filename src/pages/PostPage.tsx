
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService, NostrEvent } from '@/lib/nostr';
import NoteCard from '@/components/NoteCard';
import Sidebar from '@/components/Sidebar';
import TrendingSection from '@/components/TrendingSection';
import WhoToFollow from '@/components/WhoToFollow';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from "@/hooks/use-mobile";

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Connect to relays
      await nostrService.connectToDefaultRelays();
      
      // Subscribe to get the event by ID
      const subId = nostrService.subscribe(
        [
          {
            ids: [id],
            kinds: [1], // text notes
          }
        ],
        (fetchedEvent) => {
          setEvent(fetchedEvent);
          setLoading(false);
          
          // Fetch profile data for this pubkey
          if (fetchedEvent.pubkey) {
            fetchProfileData(fetchedEvent.pubkey);
          }
        }
      );
      
      // Cleanup
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
        (metadataEvent) => {
          try {
            const metadata = JSON.parse(metadataEvent.content);
            setProfileData(prev => ({
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
    
    fetchEvent();
  }, [id]);

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      
      <div className={isMobile ? "flex-1" : "flex-1 ml-0 md:ml-64"}>
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Post</h1>
          </div>
        </header>
        
        <div className="flex">
          <main className="flex-1 border-r min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-4">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : !event ? (
                <div className="text-center py-8">
                  <h2 className="text-xl font-semibold">Post not found</h2>
                  <p className="text-muted-foreground mt-2">
                    The post you're looking for doesn't exist or has been deleted.
                  </p>
                </div>
              ) : (
                <NoteCard 
                  event={event}
                  profileData={event.pubkey ? profileData[event.pubkey] : undefined}
                />
              )}
            </div>
          </main>
          
          {!isMobile && (
            <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
              <div className="space-y-6">
                <TrendingSection />
                <WhoToFollow />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
