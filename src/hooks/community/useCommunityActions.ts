import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { Community } from '@/types/community';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useCommunityActions = (community: Community | null) => {
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    setCurrentUserPubkey(nostrService.publicKey);
  }, []);
  
  const isMember = Boolean(
    currentUserPubkey && 
    community?.members.includes(currentUserPubkey)
  );
  
  const isCreator = Boolean(
    currentUserPubkey && 
    community?.creator === currentUserPubkey
  );
  
  const isCreatorOnlyMember = Boolean(
    isCreator && 
    community?.members.length === 1
  );
  
  const handleJoinCommunity = async () => {
    if (!community) return;
    
    toast({
      title: "Joining community",
      description: "Processing your request to join..."
    });
    
    try {
      // Create a new community event with the current user added to members
      const existingMembers = community.members || [];
      const updatedMembers = [...existingMembers];
      
      // Add current user if not already a member
      if (currentUserPubkey && !updatedMembers.includes(currentUserPubkey)) {
        updatedMembers.push(currentUserPubkey);
      }
      
      // Create updated community data
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image || "",
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      // Create community event with updated members
      const event = {
        kind: 34550, // Community event kind
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.id], // Unique identifier
          ...updatedMembers.map(pubkey => ['p', pubkey]) // All members including the new one
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        toast({
          title: "Joined community",
          description: "You are now a member of this community"
        });
      } else {
        toast({
          title: "Failed to join",
          description: "There was an error joining the community",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast({
        title: "Failed to join",
        description: "There was an error joining the community",
        variant: "destructive"
      });
    }
  };
  
  const handleLeaveCommunity = async () => {
    if (!community || !currentUserPubkey) return;
    
    toast({
      title: "Leaving community",
      description: "Processing your request to leave..."
    });
    
    try {
      // Filter out the current user from members
      const updatedMembers = community.members.filter(pubkey => pubkey !== currentUserPubkey);
      
      // Create updated community data
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image || "",
        creator: community.creator,
        createdAt: community.createdAt
      };
      
      // Create community event with updated members
      const event = {
        kind: 34550, // Community event kind
        content: JSON.stringify(communityData),
        tags: [
          ['d', community.id], // Unique identifier
          ...updatedMembers.map(pubkey => ['p', pubkey]) // All members except the current user
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        toast({
          title: "Left community",
          description: "You are no longer a member of this community"
        });
        
        // If the user was the creator and there are no members left, navigate away
        if (isCreator && updatedMembers.length === 0) {
          navigate('/communities');
        }
      } else {
        toast({
          title: "Failed to leave",
          description: "There was an error leaving the community",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      toast({
        title: "Failed to leave",
        description: "There was an error leaving the community",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateKickProposal = async (memberPubkey: string) => {
    if (!community || !currentUserPubkey) return;
    
    toast({
      title: "Creating kick proposal",
      description: "Processing your kick proposal..."
    });
    
    try {
      const kickData = {
        reason: "Member removal proposal",
        createdAt: Math.floor(Date.now() / 1000),
        endsAt: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 1 week from now
      };
      
      // Create kick proposal event
      const event = {
        kind: 34554, // Kick proposal kind
        content: JSON.stringify(kickData),
        tags: [
          ['e', community.id], // Reference to community
          ['p', memberPubkey], // Target member to kick
          ['d', `kick-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        toast({
          title: "Kick proposal created",
          description: "Members can now vote on this proposal"
        });
      } else {
        toast({
          title: "Failed to create proposal",
          description: "There was an error creating the kick proposal",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating kick proposal:", error);
      toast({
        title: "Failed to create proposal",
        description: "There was an error creating the kick proposal",
        variant: "destructive"
      });
    }
  };
  
  const handleVoteOnKick = async (kickProposalId: string, vote: boolean) => {
    if (!currentUserPubkey) return;
    
    toast({
      title: "Submitting vote",
      description: "Processing your vote on the kick proposal..."
    });
    
    try {
      // Create kick vote event
      const event = {
        kind: 34555, // Kick vote kind
        content: vote ? '1' : '0', // 1 for yes, 0 for no
        tags: [
          ['e', kickProposalId] // Reference to kick proposal
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        toast({
          title: "Vote submitted",
          description: "Your vote has been recorded"
        });
      } else {
        toast({
          title: "Failed to vote",
          description: "There was an error submitting your vote",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error voting on kick proposal:", error);
      toast({
        title: "Failed to vote",
        description: "There was an error submitting your vote",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteCommunity = async () => {
    if (!community || !isCreator) return;
    
    toast({
      title: "Deleting community",
      description: "Processing your request to delete the community..."
    });
    
    try {
      // For Nostr, we don't actually delete events, but we can publish a "tombstone" event
      // that clients can interpret as a deletion
      const event = {
        kind: 5, // Deletion event
        content: "Community deleted by creator",
        tags: [
          ['e', community.id], // Reference to the community event to delete
          ['a', `34550:${nostrService.publicKey}:${community.id}`] // Coordinate of the community
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        toast({
          title: "Community deleted",
          description: "The community has been deleted"
        });
        navigate('/communities');
      } else {
        toast({
          title: "Failed to delete",
          description: "There was an error deleting the community",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting community:", error);
      toast({
        title: "Failed to delete",
        description: "There was an error deleting the community",
        variant: "destructive"
      });
    }
  };
  
  return {
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity
  };
};
