
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import NoteCardMain from './NoteCardMain';
import { Heart } from 'lucide-react';
import NoteCardRepostHeader from '../NoteCardRepostHeader';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  hideActions?: boolean;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
  isReply?: boolean;
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
}

const NoteCard = ({
  event,
  profileData,
  hideActions = false,
  repostData,
  isReply = false,
  reactionData
}: NoteCardProps) => {
  return (
    <div>
      {/* Render repost header if this is a repost */}
      {repostData && (
        <NoteCardRepostHeader
          reposterPubkey={repostData.reposterPubkey}
          reposterProfile={repostData.reposterProfile}
        />
      )}
      
      {/* Render reaction header if this is a reaction */}
      {reactionData && (
        <div className="bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          <span>Liked this post</span>
        </div>
      )}
      
      {/* Render reply indicator if this is a reply */}
      {isReply && (
        <div className="bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground flex items-center gap-1.5">
          <span>Reply to a post</span>
        </div>
      )}
      
      {/* Main card content */}
      <NoteCardMain
        event={event}
        profileData={profileData}
        hideActions={hideActions}
        repostData={repostData}
        isReply={isReply}
        reactionData={reactionData}
      />
    </div>
  );
};

export default React.memo(NoteCard);
