import React, { memo } from 'react';
import { Note } from '@/components/notebin/hooks/types';
import { useProfile } from '@/hooks/profile';
import { NipComplianceBadge } from '@/components/feed/NipComplianceFeatures';

interface NoteCardProps {
  note: Note;
  // ... other props
}

// Create the actual component with NIP compliance check
const NoteCard: React.FC<NoteCardProps> = ({ note, ...props }) => {
  // ... existing code
  
  return (
    <div>
      {/* Display the NIP compliance badge if the note has an event */}
      {note.event && (
        <div className="mb-2">
          <NipComplianceBadge event={note.event} />
        </div>
      )}
      
      {/* ... existing code */}
    </div>
  );
};

// Export the memoized component
export default memo(NoteCard);
