
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
  reposts: RepostData[];
  postsLimit: number;
  profileData: any;
  originalPostProfiles: Record<string, any>;
}

export const RepostsTab: React.FC<RepostsTabProps> = ({ 
  loading, 
  reposts, 
  postsLimit,
  profileData,
  originalPostProfiles
}) => {
  if (loading) {
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
    </div>
  );
};
