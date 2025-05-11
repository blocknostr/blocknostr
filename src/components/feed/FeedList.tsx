
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../NoteCard";
import { motion } from "framer-motion";

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
  return (
    <div className="space-y-6">
      {/* Standard list rendering with animation */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
          >
            <NoteCard 
              event={event} 
              profileData={event.pubkey ? profiles[event.pubkey] : undefined}
              repostData={event.id && repostData[event.id] ? {
                reposterPubkey: repostData[event.id].pubkey,
                reposterProfile: repostData[event.id].pubkey ? profiles[repostData[event.id].pubkey] : undefined
              } : undefined}
            />
          </motion.div>
        ))}
        
        {/* Loading indicator at the bottom */}
        <div ref={loadMoreRef as React.RefObject<HTMLDivElement>} className="py-4 text-center">
          {loading && events.length > 0 && (
            <div className="text-muted-foreground text-sm flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading more posts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedList;
