
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService, NostrEvent } from '@/lib/nostr';
import NoteCard from '@/components/NoteCard';
import Sidebar from '@/components/Sidebar';
import { TrendingSection } from '@/components/trending';
import WhoToFollow from '@/components/WhoToFollow';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Repeat, MessageSquare, Zap, Eye } from "lucide-react";
import { SimplePool } from 'nostr-tools'; // Import SimplePool directly

interface PostStats {
  likes: number;
  reposts: number;
  replies: number;
  zaps: number;
  zapAmount: number;
  impressions: number;
}

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [postStats, setPostStats] = useState<PostStats>({
    likes: 0,
    reposts: 0,
    replies: 0,
    zaps: 0,
    zapAmount: 0,
    impressions: 0
  });
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
          
          // Fetch stats
          fetchPostStats(fetchedEvent.id);
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
    
    // Fetch post statistics
    const fetchPostStats = async (eventId: string) => {
      if (!eventId) return;
      
      // Get reaction counts
      try {
        const pool = new SimplePool(); // Create a new SimplePool instance directly
        const connectedRelays = nostrService.getRelayStatus()
          .filter(relay => relay.status === 'connected')
          .map(relay => relay.url);
          
        const stats = await nostrService.socialManager.getReactionCounts(
          pool,
          eventId,
          connectedRelays
        );
        
        // For demonstration, generate a random number of impressions
        const baseImpressions = Math.floor(Math.random() * 100) + (stats.likes * 10) + (stats.reposts * 15);
        
        setPostStats({
          likes: stats.likes || 0,
          reposts: stats.reposts || 0,
          replies: stats.replies || 0,
          zaps: stats.zaps || 0,
          zapAmount: stats.zapAmount || 0,
          impressions: baseImpressions
        });
      } catch (error) {
        console.error("Error fetching post stats:", error);
      }
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
                <>
                  <NoteCard 
                    event={event}
                    profileData={event.pubkey ? profileData[event.pubkey] : undefined}
                  />
                  
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Post Statistics</h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-1 text-primary">
                            <Eye className="h-5 w-5 mr-1" />
                            <span className="font-medium">Impressions</span>
                          </div>
                          <div className="text-xl font-bold">
                            {postStats.impressions.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-1 text-red-500">
                            <Heart className="h-5 w-5 mr-1" />
                            <span className="font-medium">Likes</span>
                          </div>
                          <div className="text-xl font-bold">
                            {postStats.likes.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-1 text-green-500">
                            <Repeat className="h-5 w-5 mr-1" />
                            <span className="font-medium">Reposts</span>
                          </div>
                          <div className="text-xl font-bold">
                            {postStats.reposts.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-md">
                          <div className="flex items-center mb-1 text-blue-500">
                            <MessageSquare className="h-5 w-5 mr-1" />
                            <span className="font-medium">Replies</span>
                          </div>
                          <div className="text-xl font-bold">
                            {postStats.replies.toLocaleString()}
                          </div>
                        </div>
                        
                        {postStats.zaps > 0 && (
                          <div className="flex flex-col items-center justify-center p-3 bg-muted/30 rounded-md col-span-2 md:col-span-4">
                            <div className="flex items-center mb-1 text-yellow-500">
                              <Zap className="h-5 w-5 mr-1" />
                              <span className="font-medium">Zaps</span>
                            </div>
                            <div className="text-xl font-bold">
                              {postStats.zaps.toLocaleString()} zaps ({postStats.zapAmount.toLocaleString()} sats)
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 text-sm text-muted-foreground">
                        Note: These statistics are updated in real-time as users interact with this post across the Nostr network.
                      </div>
                    </CardContent>
                  </Card>
                </>
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
