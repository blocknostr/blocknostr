
import React from "react";
import NoteCard from "@/components/NoteCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface RepostsTabProps {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  reposts: any[];
  postsLimit: number;
  profileData: any;
  originalPostProfiles: Record<string, any>;
  loadMoreRef: (node: HTMLDivElement | null) => void;
}

const RepostsTab: React.FC<RepostsTabProps> = ({
  loading,
  loadingMore,
  hasMore,
  reposts,
  postsLimit,
  profileData,
  originalPostProfiles,
  loadMoreRef
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] w-full pb-2">
      <div className="relative space-y-4">
        {reposts.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground">No reposts found.</p>
          </div>
        ) : (
          <>
            {reposts.map((repost) => {
              // Handle both formats: repost object or direct event
              const event = repost.originalEvent || repost;
              return <NoteCard key={event.id} event={event} />;
            })}
          </>
        )}
        
        <div ref={loadMoreRef} className="py-2 text-center">
          {loadingMore ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">Loading more reposts...</span>
            </div>
          ) : (
            <div className="h-8">{/* Spacer for intersection observer */}</div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
};

export default RepostsTab;
