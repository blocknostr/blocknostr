
import React from 'react';
import NoteCard from '@/components/NoteCard';

interface ProfileData {
  pubkey?: string;
}

interface RepliesTabProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  displayedReplies: any[];
  profileData: ProfileData;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const RepliesTab: React.FC<RepliesTabProps> = ({
  loading,
  loadingMore,
  hasMore,
  displayedReplies,
  profileData,
  loadMoreRef
}) => {
  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">Loading replies...</span>
        </div>
      ) : displayedReplies.length === 0 ? (
        <div className="flex items-center justify-center py-4">
          <span className="text-sm text-muted-foreground">No replies found.</span>
        </div>
      ) : (
        <div>
          {displayedReplies.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadingMore ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more replies...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default RepliesTab;
