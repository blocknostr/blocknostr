
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Community } from "@/types/community";
import { useNavigate } from "react-router-dom";

export interface CommunityActionsResult {
  handleJoinCommunity: () => Promise<void>;
  handleCreateKickProposal: (targetMember: string) => Promise<void>;
  handleVoteOnKick: (kickProposalId: string) => Promise<void>;
}

export const useCommunityActions = (
  community: Community | null,
  setCommunity: React.Dispatch<React.SetStateAction<Community | null>>,
  currentUserPubkey: string | null
): CommunityActionsResult => {
  const navigate = useNavigate();
  
  const handleJoinCommunity = async () => {
    if (!currentUserPubkey || !community) return;
    
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
      
      await nostrService.publishEvent(event);
      toast.success("You have joined the community!");
      
      // Update local state
      setCommunity({
        ...community,
        members: updatedMembers
      });
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };
  
  const handleCreateKickProposal = async (targetMember: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be logged in and be a member of this community");
      return;
    }
    
    try {
      // Create kick proposal event
      const event = {
        kind: 34554, // Kick proposal kind
        content: JSON.stringify({
          reason: "Community member vote to remove"
        }),
        tags: [
          ['e', community.id], // Reference to community
          ['p', targetMember, 'kick'] // Target member to kick with 'kick' marker
        ]
      };
      
      const kickProposalId = await nostrService.publishEvent(event);
      
      if (kickProposalId) {
        // Vote on our own proposal automatically
        const voteEvent = {
          kind: 34555, // Kick vote kind
          content: "1", // Vote in favor
          tags: [
            ['e', kickProposalId] // Reference to kick proposal
          ]
        };
        
        await nostrService.publishEvent(voteEvent);
        toast.success("Kick proposal created");
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast.error("Failed to create kick proposal");
    }
  };
  
  const handleVoteOnKick = async (kickProposalId: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return;
    }
    
    try {
      // Create kick vote event
      const event = {
        kind: 34555, // Kick vote kind
        content: "1", // Vote in favor
        tags: [
          ['e', kickProposalId] // Reference to kick proposal
        ]
      };
      
      await nostrService.publishEvent(event);
      toast.success("Vote on kick recorded");
    } catch (error) {
      console.error("Error voting on kick:", error);
      toast.error("Failed to vote on kick");
    }
  };

  return {
    handleJoinCommunity,
    handleCreateKickProposal,
    handleVoteOnKick
  };
};
