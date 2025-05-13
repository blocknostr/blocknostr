
import React, { memo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { NipComplianceBadge } from '@/components/feed/NipComplianceFeatures';
import NoteCardContainer from './NoteCardContainer';
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardFooter from './NoteCardFooter';
import { extractMediaUrls } from '@/lib/nostr/utils';

export interface NoteCardProps {
  note?: { 
    id: string;
    content: string;
    author: string;
    event?: NostrEvent;
  };
  event?: NostrEvent;
  profileData?: any;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: any;
  };
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
}

// Create the actual component with BlockNostr-inspired styling
const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  event, 
  profileData, 
  repostData,
  reactionData
}) => {
  // Use either a note object or an event directly
  const eventData = note?.event || event;
  const eventId = note?.id || eventData?.id;
  const content = note?.content || eventData?.content || '';
  const author = note?.author || eventData?.pubkey;
  const tags = eventData?.tags || [];
  
  // Extract media URLs for display
  const mediaUrls = eventData ? extractMediaUrls(content, tags) : [];
  
  // Get created timestamp
  const createdAt = eventData?.created_at ? new Date(eventData.created_at * 1000) : undefined;
  
  return (
    <NoteCardContainer eventId={eventId}>
      {/* Show repost header if this is a repost */}
      {repostData && (
        <div className="px-4 pt-3 pb-0 flex items-center text-xs text-muted-foreground">
          <div className="flex items-center">
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="m3 12 7-7v4h11v6H10v4z"/>
              </svg>
              Reposted by {repostData.reposterProfile?.name || repostData.reposterPubkey.slice(0, 8)}
            </span>
          </div>
        </div>
      )}
      
      {/* Main card content */}
      <div className="p-4">
        {/* Display the NIP compliance badge if we have an event */}
        {eventData && (
          <div className="mb-2 flex justify-end">
            <NipComplianceBadge event={eventData} />
          </div>
        )}
        
        {/* Profile header */}
        <NoteCardHeader 
          pubkey={author} 
          profile={profileData}
          timestamp={createdAt}
        />
        
        {/* Content area */}
        <NoteCardContent 
          content={content}
          tags={tags}
          event={eventData}
        />
        
        {/* Card footer with action buttons */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <NoteCardFooter 
            event={eventData} 
            note={{
              id: eventId || '',
              content,
              author: author || '',
              event: eventData
            }}
          />
        </div>
      </div>
    </NoteCardContainer>
  );
};

// Export the memoized component
export default memo(NoteCard);
