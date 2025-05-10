
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import LeaveCommunityButton from "./LeaveCommunityButton";

interface CommunityCardActionsProps {
  community: {
    id: string;
    name: string;
    description: string;
    image: string;
    creator: string;
    createdAt: number;
    members: string[];
    uniqueId: string;
  };
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
}

const CommunityCardActions = ({ 
  community, 
  isMember, 
  isCreator, 
  currentUserPubkey 
}: CommunityCardActionsProps) => {
  const [showInviteLink, setShowInviteLink] = useState(false);
  const navigate = useNavigate();

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserPubkey) {
      toast.error("You must be logged in to join a community");
      return;
    }
    
    try {
      // Get the existing community data and members
      const updatedMembers = [...community.members, currentUserPubkey];
      
      // Create an updated community event with the current user added as a member
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.uniqueId],
          ...updatedMembers.map(member => ['p', member])
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      if (eventId) {
        toast.success("You have joined the community!");
        // The UI will update when the event is received through the subscription
      } else {
        toast.error("Failed to join community");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const shareInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const inviteUrl = `${window.location.origin}/communities/${community.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => {
          toast.success("Invite link copied to clipboard!");
          setShowInviteLink(true);
          setTimeout(() => setShowInviteLink(false), 3000);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          toast.error("Failed to copy invite link");
        });
    } else {
      // Fallback
      toast.error("Copy to clipboard not supported in your browser");
    }
  };

  const navigateToCommunity = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/communities/${community.id}`);
  };

  return (
    <div className="w-full">
      <div className="flex w-full gap-2">
        {!isMember && !isCreator && currentUserPubkey && (
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2" 
            onClick={handleJoinClick}
          >
            <UserPlus className="h-4 w-4" />
            Join
          </Button>
        )}
        {(isMember || isCreator) && (
          <>
            {/* Show view button - now full width */}
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={navigateToCommunity}
            >
              View
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={shareInviteLink}
              title="Share invite link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      {showInviteLink && (
        <div className="px-3 pb-3 text-xs text-muted-foreground">
          Invite link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default CommunityCardActions;
