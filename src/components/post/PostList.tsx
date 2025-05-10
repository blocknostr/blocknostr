
import { useState, useEffect } from 'react';
import NoteCard from '@/components/NoteCard';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { Skeleton } from "@/components/ui/skeleton";

interface PostListProps {
  filter: {
    authors?: string[];
    kinds?: number[];
    since?: number;
    limit?: number;
    ids?: string[];
    '#p'?: string[];
    '#e'?: string[];
  };
  emptyMessage?: string;
}

const PostList = ({ filter, emptyMessage = "No posts found" }: PostListProps) => {
  const [posts, setPosts] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setPosts([]);

      // Connect to relays
      await nostrService.connectToDefaultRelays();
      
      // Subscribe to posts
      const subId = nostrService.subscribe(
        [{ ...filter, kinds: filter.kinds || [1] }],
        (event) => {
          setPosts(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === event.id)) return prev;
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this author if we don't have it
          if (event.pubkey && !profileData[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );
      
      // Set loading to false after a delay
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      
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
    
    fetchPosts();
  }, [filter]);
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }
  
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {posts.map((event) => (
        <NoteCard 
          key={event.id} 
          event={event}
          profileData={profileData[event.pubkey]}
        />
      ))}
    </div>
  );
};

export default PostList;
