
import React, { memo } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { NipComplianceBadge } from '@/components/feed/NipComplianceFeatures';
import NoteCardContainer from './NoteCardContainer';

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

// Create the actual component with NIP compliance check
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
  
  return (
    <NoteCardContainer eventId={eventId}>
      <div className="p-4">
        {/* Display the NIP compliance badge if we have an event */}
        {eventData && (
          <div className="mb-2">
            <NipComplianceBadge event={eventData} />
          </div>
        )}
        
        {/* Content would be rendered here */}
        <div className="mb-2">
          {content.slice(0, 100)}
          {content.length > 100 && '...'}
        </div>
      </div>
    </NoteCardContainer>
  );
};

// Export the memoized component
export default memo(NoteCard);
