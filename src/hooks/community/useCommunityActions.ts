import { NostrEvent, nostrService } from "@/lib/nostr";
import { Community, MemberRole } from "@/api/types/community";
import { toast } from "@/lib/toast";

export const useCommunityActions = (
  community: Community | null,
  setCommunity: React.Dispatch<React.SetStateAction<Community | null>>,
  currentUserPubkey: string | null,
  userRole: MemberRole | null
) => {
  const handleJoinCommunity = async () => {
    if (!currentUserPubkey || !community) return;
    
    try {
      // Check if this is a private community
      if (community.isPrivate) {
        toast.error("This is a private community. You need an invite to join.");
        return;
      }
      
      // Get the existing community data and members
      const updatedMembers = [...community.members, currentUserPubkey];
      
      // Create an updated community event with the current user added as a member
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt,
        isPrivate: community.isPrivate,
        guidelines: community.guidelines,
        tags: community.tags
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
        
        // Update local state
        setCommunity({
          ...community,
          members: updatedMembers
        });
      } else {
        toast.error("Failed to join community: Event could not be published");
      }
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };
  
  // Function to leave a community
  const handleLeaveCommunity = async () => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be logged in and be in a community to leave");
      return;
    }
    
    try {
      // Prevent creator from leaving their own community
      if (community.creator === currentUserPubkey) {
        toast.error("As the creator, you cannot leave your community. You can only delete it if you're the sole member.");
        return;
      }
      
      // Check if user is the creator and also a moderator
      if (community.creator === currentUserPubkey && 
          community.moderators && 
          community.moderators.length > 0) {
        toast.error("Please remove all moderators before leaving as creator");
        return;
      }
      
      // Remove current user from members list
      const updatedMembers = community.members.filter(member => member !== currentUserPubkey);
      
      // Also remove from moderators list if applicable
      const updatedModerators = community.moderators ? 
        community.moderators.filter(mod => mod !== currentUserPubkey) :
        undefined;
      
      // Create an updated community event without the current user
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt,
        isPrivate: community.isPrivate,
        guidelines: community.guidelines,
        tags: community.tags
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
        toast.success("You have left the community");
        
        // Update local state
        setCommunity({
          ...community,
          members: updatedMembers,
          moderators: updatedModerators
        });
        
        // If user was the only member and also the creator, redirect to communities page
        if (updatedMembers.length === 0 && community.creator === currentUserPubkey) {
          window.location.href = '/communities';
        }
      } else {
        toast.error("Failed to leave community: Event could not be published");
      }
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };
  
  // Function to create a kick proposal
  const handleCreateKickProposal = async (targetMember: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be logged in and be a member of this community");
      return;
    }
    
    try {
      if (targetMember === community.creator) {
        toast.error("You cannot kick the creator of the community");
        return;
      }
      
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
      } else {
        toast.error("Failed to create kick proposal: Event could not be published");
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
      
      // Also remove from moderators if applicable
      const updatedModerators = community.moderators ? 
        community.moderators.filter(mod => mod !== memberToKick) : 
        community.moderators;
      
      // Create an updated community event without the kicked member
      const communityData = {
        name: community.name,
        description: community.description,
        image: community.image,
        creator: community.creator,
        createdAt: community.createdAt,
        isPrivate: community.isPrivate,
        guidelines: community.guidelines,
        tags: community.tags
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
        toast.success("Member has been removed from the community");
        
        // Update local state
        setCommunity({
          ...community,
          members: updatedMembers,
          moderators: updatedModerators
        });
      } else {
        toast.error("Failed to remove member: Event could not be published");
      }
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
      
      const eventId = await nostrService.publishEvent(event);
      if (eventId) {
        toast.success("Vote on kick recorded");
      } else {
        toast.error("Failed to vote: Event could not be published");
      }
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
        deleted: true,
        isPrivate: community.isPrivate,
        guidelines: community.guidelines,
        tags: community.tags
      };
      
      const event = {
        kind: 34550,
        content: JSON.stringify(deletionData),
        tags: [
          ['d', community.uniqueId],
          ['p', currentUserPubkey, 'creator']
        ]
      };
      
      const eventId = await nostrService.publishEvent(event);
      if (eventId) {
        toast.success("Community has been deleted");
        window.location.href = '/communities'; // Navigate back to communities page
      } else {
        toast.error("Failed to delete community: Event could not be published");
      }
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community");
    }
  };

  // New functions for enhanced features
  
  // Function to create a new invite link
  const handleCreateInvite = async (maxUses?: number, expiresIn?: number) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be a member to create an invite link");
      return null;
    }
    
    try {
      // Create invite link event
      const currentTime = Math.floor(Date.now() / 1000);
      const expiresAt = expiresIn ? currentTime + (expiresIn * 60 * 60) : undefined;
      
      const event = {
        kind: 34557, // Community invite kind
        content: JSON.stringify({
          maxUses,
          expiresAt,
          usedCount: 0,
          createdAt: currentTime
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey]
        ]
      };
      
      const inviteId = await nostrService.publishEvent(event);
      if (inviteId) {
        toast.success("Invite link created");
        return inviteId;
      } else {
        toast.error("Failed to create invite link");
        return null;
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Failed to create invite link");
      return null;
    }
  };
  
  // Function to set community privacy setting
  const handleSetPrivate = async (isPrivate: boolean) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be the creator to change privacy settings");
      return;
    }
    
    if (community.creator !== currentUserPubkey) {
      toast.error("Only the creator can change privacy settings");
      return;
    }
    
    try {
      // Publish community metadata event for privacy setting
      const event = {
        kind: 34556, // Community metadata
        content: JSON.stringify({
          type: 'private',
          content: isPrivate,
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey]
        ]
      };
      
      const metadataId = await nostrService.publishEvent(event);
      
      if (metadataId) {
        // Also update the main community event with the new privacy setting
        const communityData = {
          name: community.name,
          description: community.description,
          image: community.image,
          creator: community.creator,
          createdAt: community.createdAt,
          isPrivate: isPrivate,
          guidelines: community.guidelines,
          tags: community.tags
        };
        
        const communityEvent = {
          kind: 34550,
          content: JSON.stringify(communityData),
          tags: [
            ['d', community.uniqueId],
            ...community.members.map(member => ['p', member])
          ]
        };
        
        await nostrService.publishEvent(communityEvent);
        
        // Update local state
        setCommunity({
          ...community,
          isPrivate
        });
        
        toast.success(`Community is now ${isPrivate ? 'private' : 'public'}`);
      } else {
        toast.error("Failed to update privacy settings");
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      toast.error("Failed to update privacy settings");
    }
  };
  
  // Function to set community guidelines
  const handleSetGuidelines = async (guidelines: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be the creator to set guidelines");
      return;
    }
    
    if (community.creator !== currentUserPubkey && 
        (!community.moderators || !community.moderators.includes(currentUserPubkey))) {
      toast.error("Only the creator or moderators can set guidelines");
      return;
    }
    
    try {
      // Publish community metadata event for guidelines
      const event = {
        kind: 34556, // Community metadata
        content: JSON.stringify({
          type: 'guidelines',
          content: guidelines,
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey]
        ]
      };
      
      const metadataId = await nostrService.publishEvent(event);
      
      if (metadataId) {
        // Also update the main community event with the new guidelines
        const communityData = {
          name: community.name,
          description: community.description,
          image: community.image,
          creator: community.creator,
          createdAt: community.createdAt,
          isPrivate: community.isPrivate,
          guidelines: guidelines,
          tags: community.tags
        };
        
        const communityEvent = {
          kind: 34550,
          content: JSON.stringify(communityData),
          tags: [
            ['d', community.uniqueId],
            ...community.members.map(member => ['p', member])
          ]
        };
        
        await nostrService.publishEvent(communityEvent);
        
        // Update local state
        setCommunity({
          ...community,
          guidelines
        });
        
        toast.success("Community guidelines updated");
      } else {
        toast.error("Failed to update guidelines");
      }
    } catch (error) {
      console.error("Error updating guidelines:", error);
      toast.error("Failed to update guidelines");
    }
  };
  
  // Function to add a moderator
  const handleAddModerator = async (moderatorPubkey: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be the creator to add moderators");
      return;
    }
    
    if (community.creator !== currentUserPubkey) {
      toast.error("Only the creator can add moderators");
      return;
    }
    
    // Convert to hex if npub format was provided
    let targetPubkey = moderatorPubkey;
    if (moderatorPubkey.startsWith('npub')) {
      try {
        targetPubkey = nostrService.getHexFromNpub(moderatorPubkey);
      } catch (error) {
        toast.error("Invalid npub format");
        return;
      }
    }
    
    // Check if user is a member
    if (!community.members.includes(targetPubkey)) {
      toast.error("User must be a community member first");
      return;
    }
    
    // Check if already a moderator
    if (community.moderators && community.moderators.includes(targetPubkey)) {
      toast.error("User is already a moderator");
      return;
    }
    
    try {
      // Publish community role event
      const event = {
        kind: 34558, // Community role
        content: JSON.stringify({
          role: 'moderator',
          action: 'add',
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey, 'creator'],
          ['p', targetPubkey, 'moderator']
        ]
      };
      
      const roleId = await nostrService.publishEvent(event);
      
      if (roleId) {
        // Update local state
        const updatedModerators = community.moderators ? 
          [...community.moderators, targetPubkey] : 
          [targetPubkey];
        
        setCommunity({
          ...community,
          moderators: updatedModerators
        });
        
        toast.success("Moderator added successfully");
      } else {
        toast.error("Failed to add moderator");
      }
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast.error("Failed to add moderator");
    }
  };
  
  // Function to remove a moderator
  const handleRemoveModerator = async (moderatorPubkey: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be the creator to remove moderators");
      return;
    }
    
    if (community.creator !== currentUserPubkey) {
      toast.error("Only the creator can remove moderators");
      return;
    }
    
    if (!community.moderators || !community.moderators.includes(moderatorPubkey)) {
      toast.error("User is not a moderator");
      return;
    }
    
    try {
      // Publish community role event
      const event = {
        kind: 34558, // Community role
        content: JSON.stringify({
          role: 'moderator',
          action: 'remove',
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey, 'creator'],
          ['p', moderatorPubkey, 'moderator']
        ]
      };
      
      const roleId = await nostrService.publishEvent(event);
      
      if (roleId) {
        // Update local state
        const updatedModerators = community.moderators.filter(mod => mod !== moderatorPubkey);
        
        setCommunity({
          ...community,
          moderators: updatedModerators
        });
        
        toast.success("Moderator removed successfully");
      } else {
        toast.error("Failed to remove moderator");
      }
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast.error("Failed to remove moderator");
    }
  };
  
  // Function to update community tags
  const handleSetCommunityTags = async (tags: string[]) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be logged in to update community tags");
      return;
    }
    
    if (community.creator !== currentUserPubkey && 
        (!community.moderators || !community.moderators.includes(currentUserPubkey))) {
      toast.error("Only the creator or moderators can update community tags");
      return;
    }
    
    try {
      // Publish community metadata event for tags
      const event = {
        kind: 34556, // Community metadata
        content: JSON.stringify({
          type: 'tags',
          content: tags,
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey],
          ...tags.map(tag => ['t', tag])
        ]
      };
      
      const metadataId = await nostrService.publishEvent(event);
      
      if (metadataId) {
        // Also update the main community event with the new tags
        const communityData = {
          name: community.name,
          description: community.description,
          image: community.image,
          creator: community.creator,
          createdAt: community.createdAt,
          isPrivate: community.isPrivate,
          guidelines: community.guidelines,
          tags: tags
        };
        
        const communityEvent = {
          kind: 34550,
          content: JSON.stringify(communityData),
          tags: [
            ['d', community.uniqueId],
            ...community.members.map(member => ['p', member]),
            ...tags.map(tag => ['t', tag])
          ]
        };
        
        await nostrService.publishEvent(communityEvent);
        
        // Update local state
        setCommunity({
          ...community,
          tags
        });
        
        toast.success("Community tags updated");
      } else {
        toast.error("Failed to update tags");
      }
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    }
  };

  // Function to set community alpha wallet
  const handleSetAlphaWallet = async (walletAddress: string) => {
    if (!currentUserPubkey || !community) {
      toast.error("You must be logged in to set the alpha wallet");
      return;
    }
    
    if (community.creator !== currentUserPubkey) {
      toast.error("Only the creator can set the alpha wallet");
      return;
    }
    
    try {
      // Basic validation for wallet address format
      if (walletAddress && !walletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{25,40}$/)) {
        toast.error("Invalid wallet address format");
        return;
      }
      
      // Publish community metadata event for alpha wallet
      const event = {
        kind: 34556, // Community metadata
        content: JSON.stringify({
          type: 'alphaWallet',
          content: walletAddress,
          createdAt: Math.floor(Date.now() / 1000)
        }),
        tags: [
          ['e', community.id],
          ['d', community.uniqueId],
          ['p', currentUserPubkey]
        ]
      };
      
      const metadataId = await nostrService.publishEvent(event);
      
      if (metadataId) {
        // Also update the main community event with the alpha wallet
        const communityData = {
          name: community.name,
          description: community.description,
          image: community.image,
          creator: community.creator,
          createdAt: community.createdAt,
          isPrivate: community.isPrivate,
          guidelines: community.guidelines,
          tags: community.tags,
          alphaWallet: walletAddress
        };
        
        const communityEvent = {
          kind: 34550,
          content: JSON.stringify(communityData),
          tags: [
            ['d', community.uniqueId],
            ...community.members.map(member => ['p', member]),
            ...(community.tags || []).map(tag => ['t', tag])
          ]
        };
        
        await nostrService.publishEvent(communityEvent);
        
        // Update local state
        setCommunity({
          ...community,
          alphaWallet: walletAddress
        } as Community);
        
        toast.success(walletAddress ? "Community alpha wallet updated" : "Community alpha wallet removed");
      } else {
        toast.error("Failed to update alpha wallet");
      }
    } catch (error) {
      console.error("Error updating alpha wallet:", error);
      toast.error("Failed to update alpha wallet");
    }
  };

  return {
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags,
    handleSetAlphaWallet
  };
};

