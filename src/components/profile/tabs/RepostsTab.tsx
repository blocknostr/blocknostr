
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Loader2 } from "lucide-react";

interface RepostData {
  originalEvent: NostrEvent;
  repostEvent: NostrEvent;
}

interface RepostsTabProps {
  reposts: RepostData[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  isLoading: boolean;
}

const RepostsTab: React.FC<RepostsTabProps> = ({ 
  reposts, 
  profileData, 
  originalPostProfiles,
  isLoading 
}) => {
  if (isLoading) {
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
      {reposts.map(({ originalEvent, repostEvent }) => (
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

export default RepostsTab;
