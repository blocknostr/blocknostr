
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import DiscordStyleChat from "@/components/community/DiscordStyleChat";

interface DiscussionSectionProps {
  proposalId: string;
  communityId: string;
  currentUserPubkey: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const DiscussionSection = ({ 
  proposalId, 
  communityId, 
  currentUserPubkey, 
  isExpanded, 
  onToggleExpand 
}: DiscussionSectionProps) => {
  return (
    <div>
      <div className="flex items-center">
        <Button
          variant={isExpanded ? "default" : "ghost"}
          size="sm"
          onClick={onToggleExpand}
          className={isExpanded ? "" : "text-muted-foreground hover:text-foreground"}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          {isExpanded ? "Hide discussion" : "Discussion"}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t w-full h-[500px] overflow-hidden rounded-md border">
          <DiscordStyleChat 
            proposalId={proposalId} 
            communityId={communityId}
            currentUserPubkey={currentUserPubkey}
          />
        </div>
      )}
    </div>
  );
};

export default DiscussionSection;

