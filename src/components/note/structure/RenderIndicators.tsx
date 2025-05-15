
import React from 'react';
import { HeartIcon, RepeatIcon, ArrowUpRight } from 'lucide-react';
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

// Using React.memo to prevent unnecessary re-renders
const RenderIndicators = React.memo(({ 
  repostData, 
  reactionData, 
  isReply 
}: RenderIndicatorsProps) => {
  // Skip rendering if no indicators
  if (!repostData && !reactionData && !isReply) return null;
  
  // Extract display name from profile for optimization
  const reposterName = repostData?.reposterProfile?.name || 
                       repostData?.reposterProfile?.display_name || 
                       (repostData?.reposterPubkey?.slice(0, 8) + '...');
  
  return (
    <>
      {/* Repost header */}
      {repostData && (
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
          <RepeatIcon className="h-4 w-4" />
          <span className="truncate">
            <span className="font-medium">{reposterName}</span> reposted
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
});

RenderIndicators.displayName = 'RenderIndicators';

export default RenderIndicators;
