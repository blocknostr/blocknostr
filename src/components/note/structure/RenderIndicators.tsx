
import React from 'react';
import { HeartIcon, RepeatIcon, ArrowUpRight } from 'lucide-react';
import NoteCardRepostHeader from '../NoteCardRepostHeader';
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
  // Skip rendering if no indicators
  if (!repostData && !reactionData && !isReply) return null;
  
  return (
    <>
      {/* Repost header */}
      {repostData && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
          <RepeatIcon className="h-4 w-4" />
          <span className="truncate">
            <NoteCardRepostHeader 
              reposterPubkey={repostData.reposterPubkey} 
              reposterProfile={repostData.reposterProfile} 
            />
          </span>
        </div>
      )}
      
      {/* Reaction header */}
      {reactionData && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
          <HeartIcon className="h-4 w-4 text-red-500" />
          <span>Liked</span>
        </div>
      )}
      
      {/* Reply indicator */}
      {isReply && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowUpRight className="h-4 w-4" />
          <span>Reply</span>
        </div>
      )}
    </>
  );
};

export default React.memo(RenderIndicators);
