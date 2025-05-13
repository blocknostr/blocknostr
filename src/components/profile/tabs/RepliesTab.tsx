
import React from "react";
import { NostrEvent } from "@/lib/nostr";
import NoteCard from "@/components/NoteCard";
import { Loader2 } from "lucide-react";

interface RepliesTabProps {
  replies: NostrEvent[];
  profileData: any;
  isLoading: boolean;
}

const RepliesTab: React.FC<RepliesTabProps> = ({ replies, profileData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading replies...</span>
      </div>
    );
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No replies found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {replies.map(event => (
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

export default RepliesTab;
