
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import { extractNip94Media, getMediaItemsFromEvent } from "@/lib/nostr/utils/media-extraction";
import { MediaItem } from "@/lib/nostr/utils/media/media-types";
import { MediaGrid } from "@/components/media/MediaGrid";
import { Loader2 } from "lucide-react";

interface MediaTabProps {
  displayedMedia: NostrEvent[];
  hasMore: boolean;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({ displayedMedia, hasMore, loadMoreRef }) => {
  const [loadMoreLoading, setLoadMoreLoading] = React.useState(false);

  // Extract media items from events following NIP-94 guidelines
  const eventMediaItems = React.useMemo(() => {
    return displayedMedia.map(event => {
      // First try NIP-94 compliant extraction
      const nip94Media = extractNip94Media(event);
      if (nip94Media.length > 0) {
        return {
          event,
          mediaItems: nip94Media
        };
      }
      
      // Fallback to standard extraction
      const mediaItems = getMediaItemsFromEvent(event);
      
      return {
        event,
        mediaItems
      };
    }).filter(item => item.mediaItems.length > 0);
  }, [displayedMedia]);

  return (
    <div>
      {eventMediaItems.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          No media found for this profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {eventMediaItems.map(({ event, mediaItems }) => (
            <div key={event.id} className="border rounded-md p-4">
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">
                  {new Date(event.created_at * 1000).toLocaleString()}
                </div>
                {event.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.content}
                  </p>
                )}
              </div>
              
              <MediaGrid 
                mediaItems={mediaItems}
                maxItems={9}
                className="mt-2"
                onMediaClick={(media) => {
                  window.open(`/post/${event.id}`, '_blank');
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} className="py-2 text-center">
        {loadMoreLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
