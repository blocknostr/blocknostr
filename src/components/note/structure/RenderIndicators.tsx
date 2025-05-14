
import React from 'react';
import NoteCardRepostHeader from '../NoteCardRepostHeader';
import { Heart } from 'lucide-react';
import { NostrEvent } from '@/lib/nostr';

interface RenderIndicatorsProps {
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
  isReply?: boolean;
}

const RenderIndicators: React.FC<RenderIndicatorsProps> = ({ 
  repostData, 
  reactionData, 
  isReply 
}) => {
  return (
    <>
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
    </>
  );
};

export default RenderIndicators;
