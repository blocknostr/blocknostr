
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Community } from "@/types/community";
import { toast } from "sonner";

export const useCommunityActions = (
  community: Community | null,
  setCommunity: React.Dispatch<React.SetStateAction<Community | null>>,
  currentUserPubkey: string | null
) => {
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
  
  // Function to create a kick proposal
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
  
  // Function to actually kick a member when threshold reached
  const handleKickMember = async (memberToKick: string) => {
    if (!community) return;
    
    try {
      // Remove member from list
      const updatedMembers = community.members.filter(member => member !== memberToKick);
      
      // Create an updated community event without the kicked member
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
      toast.success("Member has been removed from the community");
      
      // Update local state
      setCommunity({
        ...community,
        members: updatedMembers
      });
    } catch (error) {
      console.error("Error kicking member:", error);
      toast.error("Failed to remove member");
    }
  };
  
  // Function to vote on a kick proposal
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
  
  // Function to delete a community (only allowed if creator is the only member)
  const handleDeleteCommunity = async () => {
    if (!currentUserPubkey || !community) {
      return;
    }
    
    if (community.creator !== currentUserPubkey) {
      toast.error("Only the creator can delete this community");
      return;
    }
    
    if (community.members.length > 1) {
      toast.error("You can only delete the community when you're the only member");
      return;
    }
    
    try {
      // Create a deletion event (a special community event with deleted=true flag)
      const deletionData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt,
        deleted: true
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(deletionData),
        tags: [
          ['d', community.uniqueId],
          ['p', currentUserPubkey, 'creator']
        ]
      };
      
      await nostrService.publishEvent(event);
      toast.success("Community has been deleted");
      window.location.href = '/communities'; // Navigate back to communities page
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community");
    }
  };

  return {
    handleJoinCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity
  };
};
