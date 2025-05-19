
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { nostrService } from '@/lib/nostr';
import { formatDistanceToNow } from 'date-fns';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { User, MessageSquare, Repeat, Heart } from 'lucide-react';

interface NoteFeedProps {
  pubkey: string;
}

const NoteFeed: React.FC<NoteFeedProps> = ({ pubkey }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profiles, fetchProfile } = useUnifiedProfileFetcher();  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        if (!pubkey) {
          console.error('NoteFeed: No pubkey provided');
          return;
        }
        
        console.log('NoteFeed: Fetching notes for pubkey', pubkey.substring(0, 8));
        
        // Fetch profile data for the feed owner
        await fetchProfile(pubkey).catch(err => {
          console.warn('NoteFeed: Failed to fetch profile, continuing with notes fetch', err);
        });
        
        // Fetch notes
        const events = await nostrService.getEventsByUser(pubkey);
        console.log(`NoteFeed: Retrieved ${events?.length || 0} events`);
        setNotes(events || []);
        
        // Also fetch profiles for all authors of the notes
        if (events && events.length > 0) {
          const authorPubkeys = [...new Set(events.map(event => event.pubkey))];
          console.log(`NoteFeed: Fetching profiles for ${authorPubkeys.length} authors`);
          
          try {
            await Promise.all(authorPubkeys.map(authorPubkey => 
              fetchProfile(authorPubkey).catch(err => {
                console.warn(`NoteFeed: Failed to fetch author profile for ${authorPubkey.substring(0, 8)}`, err);
              })
            ));
          } catch (err) {
            console.warn('NoteFeed: Some author profiles could not be fetched', err);
          }
        }
      } catch (error) {
        console.error('NoteFeed: Error fetching notes:', error);
        // Don't let errors crash the component
        setNotes([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (pubkey) {
      fetchNotes();
    } else {
      setLoading(false);
      setNotes([]);
    }
  }, [pubkey, fetchProfile]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No notes found for this profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <Card key={note.id} className="border rounded-lg">
          <CardHeader className="p-4 pb-2">            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {profiles[note.pubkey]?.picture ? (
                  <img 
                    src={profiles[note.pubkey].picture} 
                    alt={profiles[note.pubkey]?.name || "User"} 
                    className="object-cover"                    onError={(e) => {
                      console.warn("Author image failed to load, replacing with default");
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none"; // Hide the img element
                      target.onerror = null;
                      // Parent Avatar component will show the User icon as fallback
                    }}
                  />
                ) : (
                  <User className="h-6 w-6 m-auto text-muted-foreground" />
                )}
              </Avatar>
              <div>
                <div className="font-medium">
                  {profiles[note.pubkey]?.display_name || profiles[note.pubkey]?.name || "Anonymous"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {note.created_at && formatDistanceToNow(new Date(note.created_at * 1000), { addSuffix: true })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-sm whitespace-pre-wrap break-words">{note.content}</p>
          </CardContent>
          <CardFooter className="p-3 border-t flex justify-between text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-1">
              <Repeat className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span className="text-xs">0</span>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default NoteFeed;
