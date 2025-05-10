
import { useState, useEffect } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { toast } from "sonner";

export interface Community {
  id: string;
  name: string;
  description: string;
  image: string;
  creator: string;
  createdAt: number;
  members: string[];
  uniqueId: string;
}

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
}

export interface KickProposal {
  id: string;
  communityId: string;
  targetMember: string;
  votes: string[];
  createdAt: number;
}

export const useCommunity = (communityId: string | undefined) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [kickProposals, setKickProposals] = useState<KickProposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUserPubkey = nostrService.publicKey;
  const isMember = community?.members.includes(currentUserPubkey || '') || false;
  const isCreator = community?.creator === currentUserPubkey;
  const isCreatorOnlyMember = community?.members.length === 1 && isCreator;
  
  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) return;
      
      setLoading(true);
      await nostrService.connectToUserRelays();
      
      // Subscribe to community events with this ID
      const communitySubId = nostrService.subscribe(
        [
          {
            kinds: [34550],
            ids: [communityId],
            limit: 1
          }
        ],
        handleCommunityEvent
      );
      
      // Load proposals for this community
      loadProposals(communityId);
      
      // Load kick proposals for this community
      loadKickProposals(communityId);
      
      return () => {
        nostrService.unsubscribe(communitySubId);
      };
    };
    
    loadCommunity();
  }, [communityId]);
  
  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the unique identifier tag
      const idTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'd');
      if (!idTag) return;
      const uniqueId = idTag[1];
      
      // Parse community data
      const communityData = JSON.parse(event.content);
      
      // Get members from tags
      const memberTags = event.tags.filter(tag => tag.length >= 2 && tag[0] === 'p');
      const members = memberTags.map(tag => tag[1]);
      
      const community: Community = {
        id: event.id,
        name: communityData.name || 'Unnamed Community',
        description: communityData.description || '',
        image: communityData.image || '',
        creator: event.pubkey || '',
        createdAt: event.created_at,
        members,
        uniqueId
      };
      
      setCommunity(community);
      setLoading(false);
    } catch (e) {
      console.error("Error processing community event:", e);
      setLoading(false);
    }
  };
  
  const loadProposals = (communityId: string) => {
    // Subscribe to proposal events for this community
    const proposalSubId = nostrService.subscribe(
      [
        {
          kinds: [34551],
          '#e': [communityId],
          limit: 50
        }
      ],
      handleProposalEvent
    );
    
    // Subscribe to vote events
    const votesSubId = nostrService.subscribe(
      [
        {
          kinds: [34552], // Vote events
          // Don't filter by community - we'll filter by proposal ID in the handler
          limit: 200
        }
      ],
      handleVoteEvent
    );
    
    return () => {
      nostrService.unsubscribe(proposalSubId);
      nostrService.unsubscribe(votesSubId);
    };
  };
  
  const loadKickProposals = (communityId: string) => {
    const kickProposalSubId = nostrService.subscribe(
      [
        {
          kinds: [34554], // Kick proposal kind
          '#e': [communityId],
          limit: 50
        }
      ],
      handleKickProposalEvent
    );
    
    const kickVotesSubId = nostrService.subscribe(
      [
        {
          kinds: [34555], // Kick vote kind
          limit: 100
        }
      ],
      handleKickVoteEvent
    );
    
    return () => {
      nostrService.unsubscribe(kickProposalSubId);
      nostrService.unsubscribe(kickVotesSubId);
    };
  };
  
  const handleProposalEvent = (event: NostrEvent) => {
    try {
      console.log("Received proposal event:", event);
      if (!event.id) return;
      
      // Find the community reference tag
      const communityTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!communityTag) return;
      const communityId = communityTag[1];
      
      // Parse proposal data
      const proposalData = JSON.parse(event.content);
      
      const proposal: Proposal = {
        id: event.id,
        communityId,
        title: proposalData.title || 'Unnamed Proposal',
        description: proposalData.description || '',
        options: proposalData.options || ['Yes', 'No'],
        createdAt: event.created_at,
        endsAt: proposalData.endsAt || (event.created_at + 7 * 24 * 60 * 60), // Default 1 week
        creator: event.pubkey || '',
        votes: {}
      };
      
      setProposals(prev => {
        // Check if we already have this proposal
        if (prev.some(p => p.id === proposal.id)) {
          return prev;
        }
        
        // Add new proposal
        return [...prev, proposal].sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (e) {
      console.error("Error processing proposal event:", e);
    }
  };
  
  const handleVoteEvent = (event: NostrEvent) => {
    try {
      console.log("Received vote event:", event);
      if (!event.id || !event.pubkey) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const proposalId = proposalTag[1];
      
      // Find the proposal
      const proposalIndex = proposals.findIndex(p => p.id === proposalId);
      if (proposalIndex < 0) {
        console.log("Vote for unknown proposal:", proposalId);
        return; // We don't have this proposal
      }
      
      // Parse the option index from content
      const optionIndex = parseInt(event.content);
      if (isNaN(optionIndex)) {
        console.error("Invalid vote option index:", event.content);
        return;
      }

      console.log(`Vote from ${event.pubkey} for proposal ${proposalId}, option ${optionIndex}`);
      
      // Update the votes
      setProposals(prev => {
        const updated = [...prev];
        const proposal = {...updated[proposalIndex]};
        
        // Create votes object if it doesn't exist
        if (!proposal.votes) {
          proposal.votes = {};
        }
        
        // Record this vote (overwriting any previous vote from this pubkey)
        proposal.votes[event.pubkey] = optionIndex;
        
        console.log("Updated proposal votes:", proposal.votes);
        
        updated[proposalIndex] = proposal;
        return updated;
      });
    } catch (e) {
      console.error("Error processing vote event:", e);
    }
  };
  
  // Handle kick proposal events
  const handleKickProposalEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the community reference tag
      const communityTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!communityTag) return;
      const communityId = communityTag[1];
      
      // Find the target member tag
      const targetTag = event.tags.find(tag => tag.length >= 3 && tag[0] === 'p' && tag[2] === 'kick');
      if (!targetTag) return;
      const targetMember = targetTag[1];
      
      const kickProposal: KickProposal = {
        id: event.id,
        communityId,
        targetMember,
        votes: [event.pubkey || ''], // Creator's vote is automatically included
        createdAt: event.created_at
      };
      
      setKickProposals(prev => {
        // Check if we already have this proposal
        if (prev.some(p => p.id === kickProposal.id)) {
          return prev;
        }
        
        // Add new kick proposal
        return [...prev, kickProposal];
      });
    } catch (e) {
      console.error("Error processing kick proposal event:", e);
    }
  };
  
  // Handle kick vote events
  const handleKickVoteEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the kick proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const kickProposalId = proposalTag[1];
      
      // Find the kick proposal
      const proposalIndex = kickProposals.findIndex(p => p.id === kickProposalId);
      if (proposalIndex < 0) return; // We don't have this proposal
      
      // Update the votes
      setKickProposals(prev => {
        const updated = [...prev];
        const proposal = {...updated[proposalIndex]};
        
        // Add this vote if not already included
        if (!proposal.votes.includes(event.pubkey || '')) {
          proposal.votes = [...proposal.votes, event.pubkey || ''];
        }
        
        updated[proposalIndex] = proposal;
        
        // Check if we have enough votes to kick (51% or more)
        if (community && (proposal.votes.length / community.members.length) >= 0.51) {
          // Execute the kick
          handleKickMember(proposal.targetMember);
        }
        
        return updated;
      });
    } catch (e) {
      console.error("Error processing kick vote event:", e);
    }
  };
  
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
    
    if (!isCreator) {
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
    community,
    proposals,
    kickProposals,
    loading,
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity
  };
};
