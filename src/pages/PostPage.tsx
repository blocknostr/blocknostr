import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Note } from '@/components/notebin/hooks/types';
import { useNoteCardActions } from '@/components/note/hooks/useNoteCardActions';
import NoteCard from '@/components/note/NoteCard';
import { useNostr } from '@/lib/nostr';
import { BackButton } from '@/components/ui/back-button';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useProfile } from '@/hooks/useProfile';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { ProfileNotes } from '@/components/profile/ProfileNotes';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { ProfileContactList } from '@/components/profile/ProfileContactList';
import { ProfileRelays } from '@/components/profile/ProfileRelays';
import { ProfileCommunities } from '@/components/profile/ProfileCommunities';
import { ProfileHighlights } from '@/components/profile/ProfileHighlights';
import { ProfileHighlightsSkeleton } from '@/components/profile/ProfileHighlightsSkeleton';
import { ProfileNotesSkeleton } from '@/components/profile/ProfileNotesSkeleton';
import { ProfileContactListSkeleton } from '@/components/profile/ProfileContactListSkeleton';
import { ProfileRelaysSkeleton } from '@/components/profile/ProfileRelaysSkeleton';
import { ProfileCommunitiesSkeleton } from '@/components/profile/ProfileCommunitiesSkeleton';
import { ProfileBadgesSkeleton } from '@/components/profile/ProfileBadgesSkeleton';
import { ProfileSettingsSkeleton } from '@/components/profile/ProfileSettingsSkeleton';
import { useEventSubscription } from '@/components/feed/hooks';
import { EVENT_KINDS } from '@/lib/nostr';

const PostPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [note, setNote] = useState<Note | null>(null);
  const { nostrService } = useNostr();
  const { subscribe } = useEventSubscription();

  useEffect(() => {
    if (!eventId || !nostrService) return;

    const filters = [{ ids: [eventId] }];

    subscribe(filters, (event: any) => {
      if (event) {
        setNote({
          id: event.id,
          author: event.pubkey,
          content: event.content,
          createdAt: event.created_at,
          event: event,
        });
      }
    });

  }, [eventId, nostrService, subscribe]);

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2>Loading post...</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <BackButton />
      <NoteCard note={note} />
    </div>
  );
};

export default PostPage;
