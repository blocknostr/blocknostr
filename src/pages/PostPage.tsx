import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NostrEvent, nostrService } from '@/lib/nostr';
import { EVENT_KINDS } from '@/lib/nostr/constants';
import NoteCard from '@/components/note/NoteCard';
import Sidebar from '@/components/Sidebar';
import { BackButton } from '@/components/navigation/BackButton';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const PostPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<NostrEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { profiles, fetchProfile } = useProfile();

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;

    setIsLoading(true);

    try {
      const filters = [{ ids: [eventId] }];

      const subId = nostrService.subscribe(
        filters,
        (event: NostrEvent) => {
          if (event) {
            setEvent(event);
            if (event.pubkey) {
              fetchProfile(event.pubkey);
            }
          }
        }
      );
    } catch (error) {
      console.error("Error fetching event:", error);
      toast.error("Failed to load post.");
    } finally {
      setIsLoading(false);
    }
  }, [eventId, fetchProfile]);

  useEffect(() => {
    fetchEvent();

    return () => {
      // Clean up subscription if needed
    };
  }, [fetchEvent]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6">
          <BackButton onClick={() => navigate(-1)} />
          <div className="text-center mt-10">Loading post...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6">
          <BackButton onClick={() => navigate(-1)} />
          <div className="text-center mt-10">Post not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <BackButton onClick={() => navigate(-1)} />
        <NoteCard
          note={event}
          profile={profiles[event.pubkey]}
          isExpanded={true}
        />
        <Toaster position="bottom-right" />
      </div>
    </div>
  );
};

export default PostPage;
