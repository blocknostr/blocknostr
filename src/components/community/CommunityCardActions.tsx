
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Link as LinkIcon, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";

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
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const handleJoinClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserPubkey) {
      toast.warning("Login required", {
        description: "You must be logged in to join a community"
      });
      return;
    }
    
    try {
      setJoining(true);
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
      
      const result = await nostrService.publishEvent(event);
      
      if (result) {
        toast.success(`Joined ${community.name}!`, {
          description: "You can now participate in this community",
          action: {
            label: "View",
            onClick: () => navigate(`/communities/${community.id}`),
          }
        });
        
        // Navigate to the community page after successful join
        setTimeout(() => {
          navigate(`/communities/${community.id}`);
        }, 500);
      } else {
        throw new Error("Failed to publish join event");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community", {
        description: "Please try again or check your connection"
      });
    } finally {
      setJoining(false);
    }
  };

  const shareInviteLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const inviteUrl = `${window.location.origin}/communities/${community.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl)
        .then(() => {
          toast.success("Invite link copied!", {
            description: "You can now share it with others"
          });
          setShowInviteLink(true);
          setTimeout(() => setShowInviteLink(false), 3000);
        })
        .catch(err => {
          console.error("Failed to copy:", err);
          toast.error("Failed to copy invite link");
        });
    } else {
      toast.warning("Copy not supported", {
        description: "Your browser doesn't support automatic copying"
      });
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
            variant="default" 
            className="flex-1 flex items-center justify-center gap-2" 
            onClick={handleJoinClick}
            disabled={joining}
          >
            {joining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Joining...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Join</span>
              </>
            )}
          </Button>
        )}
        {(isMember || isCreator) && (
          <>
            <Button 
              variant="outline" 
              className="flex-1 flex items-center justify-center gap-2"
              onClick={navigateToCommunity}
            >
              <Eye className="h-4 w-4" />
              <span>View</span>
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
        <div className="mt-2 text-xs text-muted-foreground">
          Invite link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default CommunityCardActions;
