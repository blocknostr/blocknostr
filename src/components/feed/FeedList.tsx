
import React, { useState } from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../NoteCard";
import VirtualizedFeedList from "./VirtualizedFeedList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeedListProps {
  events: NostrEvent[];
  profiles: Record<string, any>;
  repostData: Record<string, { pubkey: string, original: NostrEvent }>;
  loadMoreRef: React.RefObject<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  loading: boolean;
}

const FeedList: React.FC<FeedListProps> = ({
  events,
  profiles,
  repostData,
  loadMoreRef,
  loading
}) => {
  const [viewMode, setViewMode] = useState<'standard' | 'virtualized'>('virtualized');
  
  return (
    <div className="space-y-4">
      {/* View mode selector */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'standard' | 'virtualized')}>
        <div className="flex justify-end mb-2">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="standard" className="text-xs px-3">
              Standard View
            </TabsTrigger>
            <TabsTrigger value="virtualized" className="text-xs px-3">
              Optimized View
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="standard">
          {/* Standard list rendering */}
          <div className="space-y-4">
            {events.map(event => (
              <NoteCard 
                key={event.id} 
                event={event} 
                profileData={event.pubkey ? profiles[event.pubkey] : undefined}
                repostData={event.id && repostData[event.id] ? {
                  reposterPubkey: repostData[event.id].pubkey,
                  reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
                } : undefined}
              />
            ))}
            
            {/* Loading indicator at the bottom */}
            <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-4 text-center">
              {loading && events.length > 0 && (
                <div className="text-muted-foreground text-sm">
                  Loading more posts...
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="virtualized">
          {/* Virtualized list rendering for better performance */}
          <VirtualizedFeedList
            events={events}
            profiles={profiles}
            repostData={repostData}
            loadMoreRef={loadMoreRef}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedList;
