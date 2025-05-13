
import React from "react";
import NoteCard from "@/components/NoteCard";
import { NostrEvent } from "@/lib/nostr";
import { Loader2 } from "lucide-react";

interface RepliesTabProps {
  loading: boolean;
  displayedReplies: NostrEvent[];
  profileData: any;
}

export const RepliesTab: React.FC<RepliesTabProps> = ({ 
  loading, 
  displayedReplies, 
  profileData 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading replies...</span>
      </div>
    );
  }

  if (!displayedReplies || displayedReplies.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No replies found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedReplies.map(event => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={profileData || undefined}
          isReply={true}
        />
      ))}
    </div>
  );
};
