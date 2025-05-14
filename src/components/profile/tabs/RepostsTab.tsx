
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface RepostData {
  originalEvent: NostrEvent;
  repostEvent: NostrEvent;
}

interface RepostsTabProps {
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  reposts: RepostData[];
  postsLimit: number;
  profileData: any;
  originalPostProfiles: Record<string, any>;
  loadMoreRef?: (node: HTMLDivElement | null) => void;
}

export const RepostsTab: React.FC<RepostsTabProps> = ({ 
  loading, 
  loadingMore = false,
  hasMore = false,
  reposts, 
  postsLimit,
  profileData,
  originalPostProfiles,
  loadMoreRef
}) => {
  if (loading && (!reposts || reposts.length === 0)) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading reposts...</span>
      </div>
    );
  }

  if (!reposts || reposts.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No reposts found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reposts.slice(0, postsLimit).map(({ originalEvent, repostEvent }) => (
        <NoteCard 
          key={originalEvent.id} 
          event={originalEvent} 
          profileData={
            originalEvent && originalEvent.pubkey && 
            originalPostProfiles && originalPostProfiles[originalEvent.pubkey] 
              ? originalPostProfiles[originalEvent.pubkey] 
              : undefined
          }
          repostData={{
            reposterPubkey: repostEvent?.pubkey || '',
            reposterProfile: profileData
          }}
        />
      ))}
      
      {/* Infinite scroll loader */}
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="py-4 flex justify-center"
        >
          {loadingMore ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading more reposts...</span>
            </div>
          ) : (
            <div className="h-8" /> {/* Spacer for intersection observer */}
          )}
        </div>
      )}
    </div>
  );
};
