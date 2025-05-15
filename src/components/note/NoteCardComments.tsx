
import React, { useEffect, useState } from 'react';
import { nostrService } from '@/lib/nostr';
import NoteCard from './NoteCard';
import { Loader2 } from 'lucide-react';

interface NoteCardCommentsProps {
  eventId: string;
  pubkey: string;
  replyUpdated?: number;
  onReplyAdded?: () => void;
  onReplyCountUpdate?: (count: number) => void; // Added to update parent with count
}

const NoteCardComments = ({ 
  eventId, 
  pubkey, 
  replyUpdated = 0, 
  onReplyAdded,
  onReplyCountUpdate
}: NoteCardCommentsProps) => {
  const [replies, setReplies] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Fetch replies whenever the eventId or replyUpdated changes
  useEffect(() => {
    if (!eventId) return;

    const fetchReplies = async () => {
      setLoading(true);

      try {
        // Get replies to the post
        const replyFilter = {
          kinds: [1],
          "#e": [eventId]
        };
        
        const defaultRelays = ["wss://relay.damus.io", "wss://nos.lol"];
        
        // Set up a subscription for replies
        const sub = nostrService.subscribe([replyFilter], async (event) => {
          // Verify it's actually a reply to our event (using tags)
          if (event.tags && event.tags.some(tag => tag[0] === 'e' && tag[1] === eventId)) {
            // Check if we already have this reply
            if (!replies.some(r => r.id === event.id)) {
              setReplies(prevReplies => {
                const newReplies = [...prevReplies, event];
                
                // Update parent component with count
                if (onReplyCountUpdate) {
                  onReplyCountUpdate(newReplies.length);
                }
                
                return newReplies;
              });
              
              // Fetch profile data if not already loaded
              if (!profiles[event.pubkey]) {
                try {
                  const profile = await nostrService.getUserProfile(event.pubkey);
                  if (profile) {
                    setProfiles(prev => ({
                      ...prev,
                      [event.pubkey]: profile
                    }));
                  }
                } catch (error) {
                  console.error("Error fetching profile:", error);
                }
              }
            }
          }
        }, defaultRelays);
        
        // Wait a moment to collect initial replies
        setTimeout(() => {
          setLoading(false);
        }, 1500);
        
        return () => {
          if (sub && nostrService.unsubscribe) {
            nostrService.unsubscribe(sub);
          }
        };
      } catch (error) {
        console.error("Error fetching replies:", error);
        setLoading(false);
      }
    };

    fetchReplies();
  }, [eventId, replyUpdated]);

  // Update parent with count when component mounts
  useEffect(() => {
    if (onReplyCountUpdate) {
      onReplyCountUpdate(replies.length);
    }
  }, [replies.length, onReplyCountUpdate]);

  if (loading && replies.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (replies.length === 0 && !loading) {
    return (
      <div className="py-6 text-center text-muted-foreground text-sm">
        No replies yet. Be the first to reply!
      </div>
    );
  }

  // Sort replies by timestamp, newest first
  const sortedReplies = [...replies].sort((a, b) => b.created_at - a.created_at);

  return (
    <div className="space-y-3 pt-1">
      {sortedReplies.map((reply) => (
        <NoteCard
          key={reply.id}
          event={reply}
          profileData={reply.pubkey ? profiles[reply.pubkey] : undefined}
          hideActions={true}
          isReply={true}
        />
      ))}
    </div>
  );
};

export default NoteCardComments;
