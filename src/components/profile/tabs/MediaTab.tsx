
import React from "react";
import NoteCard from "@/components/note/MemoizedNoteCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MediaTabProps {
  displayedMedia: any[];
  hasMore: boolean;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({ displayedMedia, hasMore, loadMoreRef }) => {
  const [loadMoreLoading, setLoadMoreLoading] = React.useState(false);

  return (
    <div>
      {displayedMedia.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          No media found for this profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedMedia.map((event) => (
            <NoteCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <span className="text-sm text-muted-foreground">Loading more media...</span>
          </div>
        ) : (
          <div className="h-8">{/* Spacer for intersection observer */}</div>
        )}
      </div>
    </div>
  );
};

export default MediaTab;
