import React, { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { nostrService } from "@/lib/nostr";
import { NoteCard } from "@/components/NoteCard";
import { useInView } from "react-intersection-observer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface MediaTabProps {
  npub: string;
}

const MediaTab: React.FC<MediaTabProps> = ({ npub }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);

  const fetchMedia = useCallback(async ({ pageParam = null }) => {
    try {
      const mediaEvents = await nostrService.getMediaForProfile(npub, pageParam);
      return mediaEvents;
    } catch (error) {
      console.error("Error fetching media:", error);
      setHasError(true);
      return [];
    }
  }, [npub]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery(
    ["media", npub],
    fetchMedia,
    {
      getNextPageParam: (lastPage) => {
        if (lastPage && lastPage.length > 0) {
          const lastEvent = lastPage[lastPage.length - 1];
          return lastEvent.id;
        }
        return null;
      },
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (data) {
      // Flatten the pages into a single array
      const allEvents = data.pages.reduce((acc, page) => acc.concat(page), []);
      setEvents(allEvents);
    }
  }, [data]);

  const [loadMoreRef, inView] = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMoreMedia = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    if (inView && hasNextPage) {
      loadMoreMedia();
    }
  }, [inView, hasNextPage]);

  const loadMoreLoading = isFetchingNextPage || isLoading;

  if (hasError || isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load media. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {events.length === 0 && !isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          No media found for this profile.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {events.map((event) => (
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
