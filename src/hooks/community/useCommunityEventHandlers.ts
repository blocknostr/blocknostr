
import { useState } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { Community, Proposal, KickProposal } from "@/types/community";
import { toast } from "sonner";

export interface CommunityEventHandlersResult {
  handleCommunityEvent: (event: NostrEvent) => void;
  handleProposalEvent: (event: NostrEvent) => void;
  handleVoteEvent: (event: NostrEvent) => void;
  handleKickProposalEvent: (event: NostrEvent) => void;
  handleKickVoteEvent: (event: NostrEvent) => void;
  handleKickMember: (memberToKick: string) => Promise<void>;
}

export const useCommunityEventHandlers = (
  community: Community | null,
  setCommunity: React.Dispatch<React.SetStateAction<Community | null>>,
  proposals: Proposal[],
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>,
  kickProposals: KickProposal[],
  setKickProposals: React.Dispatch<React.SetStateAction<KickProposal[]>>
): CommunityEventHandlersResult => {
  
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
      
      const communityObj: Community = {
        id: event.id,
        name: communityData.name || 'Unnamed Community',
        description: communityData.description || '',
        image: communityData.image || '',
        creator: event.pubkey || '',
        createdAt: event.created_at,
        members,
        uniqueId
      };
      
      setCommunity(communityObj);
    } catch (e) {
      console.error("Error processing community event:", e);
    }
  };

  const handleProposalEvent = (event: NostrEvent) => {
    try {
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
      if (!event.id) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const proposalId = proposalTag[1];
      
      // Find the proposal
      setProposals(prev => {
        const proposalIndex = prev.findIndex(p => p.id === proposalId);
        if (proposalIndex < 0) return prev; // We don't have this proposal
        
        const optionIndex = parseInt(event.content);
        if (isNaN(optionIndex)) return prev;
        
        // Update the votes
        const updated = [...prev];
        const proposal = {...updated[proposalIndex]};
        
        // Record this vote (overwriting any previous vote from this pubkey)
        proposal.votes[event.pubkey || ''] = optionIndex;
        
        updated[proposalIndex] = proposal;
        return updated;
      });
    } catch (e) {
      console.error("Error processing vote event:", e);
    }
  };
  
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
  
  const handleKickVoteEvent = (event: NostrEvent) => {
    try {
      if (!event.id) return;
      
      // Find the kick proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const kickProposalId = proposalTag[1];
      
      // Find the kick proposal
      setKickProposals(prev => {
        const proposalIndex = prev.findIndex(p => p.id === kickProposalId);
        if (proposalIndex < 0) return prev; // We don't have this proposal
        
        // Update the votes
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

  return {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent,
    handleKickMember
  };
};
