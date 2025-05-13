
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "../../note/MemoizedNoteCard";

interface FeedItemProps {
  event: NostrEvent;
  index: number;
  profileData?: any;
  repostData?: { pubkey: string, original: NostrEvent } | undefined;
}

const FeedItem: React.FC<FeedItemProps> = ({ 
  event, 
  index, 
  profileData, 
  repostData 
}) => {
  return (
    <div
      className="animate-fade-in"
      style={{
        animationDelay: `${Math.min(index * 50, 500)}ms`,
        animationFillMode: 'both'
      }}
    >
      <NoteCard
        event={event}
        profileData={profileData}
        repostData={repostData ? {
          reposterPubkey: repostData.pubkey,
          reposterProfile: repostData.pubkey ? profileData : undefined
        } : undefined}
      />
    </div>
  );
};

export default FeedItem;
