import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import NoteCardHeader from '@/components/note/NoteCardHeader';
import NoteCardContent from '@/components/note/NoteCardContent';
import NoteCardComments from '@/components/note/NoteCardComments';
import NoteCardActions from '@/components/note/NoteCardActions';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { nostrService, NostrEvent } from '@/lib/nostr'; // Added NostrEvent
import { SimplePool } from 'nostr-tools';
import { SocialManager } from '@/lib/nostr/social';
import { toast } from 'sonner';
import { Note } from '@/components/notebin/hooks/types';
import { useUserProfile } from '@/hooks/queries/useProfileQueries';

// Using NostrEvent directly for currentNote state

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoadingNote, setIsLoadingNote] = useState(true);
  const [currentNote, setCurrentNote] = useState<NostrEvent | null>(null); // Use NostrEvent type
  const [reactionCounts, setReactionCounts] = useState({
    likes: 0,
    reposts: 0,
    replies: 0,
    zaps: 0,
    zapAmount: 0
  });
  const [showReplies, setShowReplies] = useState(true);
  const [replyUpdated, setReplyUpdated] = useState(0);
  const [pool] = useState(() => new SimplePool());

  const socialManager = useMemo(() => new SocialManager(pool, {}), [pool]); // Memoize socialManager
  const defaultRelays = useMemo(() => ["wss://relay.damus.io", "wss://nos.lol"], []);

  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError
  } = useUserProfile(currentNote?.pubkey, {
    enabled: !!currentNote?.pubkey,
  });

  useEffect(() => {
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      toast.error("Failed to load author's profile.");
    }
  }, [profileError]);

  const fetchReactionCounts = useCallback(async (eventId: string) => {
    try {
      if (!eventId) return;
      const counts = await socialManager.getReactionCounts(eventId, defaultRelays);
      setReactionCounts(counts);
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
      toast.error("Failed to load reaction counts.");
    }
  }, [socialManager, defaultRelays]);

  const handleEvent = useCallback((event: NostrEvent) => {
    setCurrentNote(event);
    if (event && event.id) {
      fetchReactionCounts(event.id);
    }
  }, [fetchReactionCounts]);

  useEffect(() => {
    if (!id) return;

    const fetchNote = async () => {
      try {
        setIsLoadingNote(true);
        await nostrService.connectToUserRelays();
        const filters = [{ ids: [id] }];

        if (nostrService.subscribe) {
          const sub = nostrService.subscribe(filters, (event: NostrEvent) => { // Type event here
            handleEvent(event);
          }, defaultRelays);

          return () => {
            if (sub && nostrService.unsubscribe) {
              nostrService.unsubscribe(sub);
            }
          };
        }
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('Failed to load post');
      } finally {
        setIsLoadingNote(false);
      }
    };

    fetchNote();
  }, [id, handleEvent, defaultRelays]);

  const renderStats = () => {
    return (
      <div className="flex gap-4 text-xs text-muted-foreground py-2 border-b px-4 md:px-6">
        <div title="Replies">
          <span className="font-medium">{reactionCounts.replies || 0}</span> {reactionCounts.replies === 1 ? 'Reply' : 'Replies'}
        </div>
        <div title="Reposts">
          <span className="font-medium">{reactionCounts.reposts || 0}</span> {reactionCounts.reposts === 1 ? 'Repost' : 'Reposts'}
        </div>
        <div title="Likes">
          <span className="font-medium">{reactionCounts.likes || 0}</span> {reactionCounts.likes === 1 ? 'Like' : 'Likes'}
        </div>
        <div title="Zaps">
          <span className="font-medium">{reactionCounts.zaps || 0}</span> {reactionCounts.zaps === 1 ? 'Zap' : 'Zaps'}
        </div>
        {reactionCounts.zapAmount > 0 && (
          <div title="Zap Amount">
            <span className="font-medium">{reactionCounts.zapAmount}</span> sats
          </div>
        )}
      </div>
    );
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getAsNote = (): Note => {
    return {
      id: currentNote?.id || '',
      author: currentNote?.pubkey || '',
      content: currentNote?.content || '',
      createdAt: currentNote?.created_at || 0,
      event: currentNote // currentNote can be null, Note.event expects NostrEvent | undefined
    };
  };

  const handleReplyAdded = () => {
    if (currentNote?.id) {
      fetchReactionCounts(currentNote.id);
      setReplyUpdated(prev => prev + 1);
    }
  };

  // Combined loading state for initial data (note and its profile)
  const isInitiallyLoading = isLoadingNote || (!!currentNote?.pubkey && isProfileLoading && !userProfile);

  if (isInitiallyLoading) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentNote) {
    return (
      <div className="container py-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Post not found</h2>
            <p className="text-muted-foreground">The note you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="p-4 md:p-6">
            <NoteCardHeader
              pubkey={currentNote.pubkey} // currentNote is guaranteed to be non-null here
              createdAt={currentNote.created_at}
              profileData={userProfile || undefined}
            />

            <NoteCardContent
              content={currentNote.content}
              tags={currentNote.tags}
              event={currentNote}
            />

            <div className="mt-3">
              <NoteCardActions
                note={getAsNote()} // getAsNote handles potential nullability for its return type
                setActiveReply={() => setShowReplies(true)}
              />
            </div>
          </div>

          {renderStats()}

          {currentNote.id && (
            <NoteCardComments
              eventId={currentNote.id}
              pubkey={currentNote.pubkey}
              onReplyAdded={handleReplyAdded}
              key={`comments-${replyUpdated}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostPage;
