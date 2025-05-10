
import { NostrEvent } from "@/lib/nostr";
import { Community, KickProposal, Proposal, PendingVotes } from "@/types/community";
import { useState, useCallback } from "react";
import { toast } from "sonner";

export const useCommunityEventHandlers = (
  setCommunity: React.Dispatch<React.SetStateAction<Community | null>>,
  setProposals: React.Dispatch<React.SetStateAction<Proposal[]>>,
  setKickProposals: React.Dispatch<React.SetStateAction<KickProposal[]>>,
  pendingVotes: PendingVotes,
  setPendingVotes: React.Dispatch<React.SetStateAction<PendingVotes>>,
  handleKickMember: (memberToKick: string) => Promise<void>
) => {
  // Callback to apply pending votes for a proposal
  const applyPendingVotes = useCallback((proposalId: string) => {
    if (pendingVotes[proposalId] && pendingVotes[proposalId].length > 0) {
      console.log(`Applying ${pendingVotes[proposalId].length} pending votes for proposal ${proposalId}`);
      
      // Process each pending vote for this proposal
      pendingVotes[proposalId].forEach(voteEvent => {
        setProposals(prev => {
          const proposalIndex = prev.findIndex(p => p.id === proposalId);
          if (proposalIndex < 0) return prev;
          
          const updatedProposals = [...prev];
          const proposal = {...updatedProposals[proposalIndex]};
          
          // Ensure votes object exists
          if (!proposal.votes) {
            proposal.votes = {};
          }
          
          // Parse option index and add vote
          const optionIndex = parseInt(voteEvent.content);
          if (!isNaN(optionIndex)) {
            proposal.votes[voteEvent.pubkey] = optionIndex;
          }
          
          updatedProposals[proposalIndex] = proposal;
          return updatedProposals;
        });
      });
      
      // Clear pending votes for this proposal
      setPendingVotes(prev => {
        const updated = {...prev};
        delete updated[proposalId];
        return updated;
      });
    }
  }, [pendingVotes, setPendingVotes, setProposals]);

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
    } catch (e) {
      console.error("Error processing community event:", e);
    }
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
      
      // Apply any pending votes for this proposal
      applyPendingVotes(event.id);
      
    } catch (e) {
      console.error("Error processing proposal event:", e);
    }
  };
  
  const handleVoteEvent = (event: NostrEvent) => {
    try {
      if (!event.id || !event.pubkey) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!proposalTag) return;
      const proposalId = proposalTag[1];
      
      console.log(`Received vote from ${event.pubkey} for proposal ${proposalId}: ${event.content}`);
      
      // Find the proposal
      setProposals(prev => {
        const proposalIndex = prev.findIndex(p => p.id === proposalId);
        
        if (proposalIndex < 0) {
          console.log(`Vote for unknown proposal: ${proposalId}, storing as pending`);
          
          // Store vote as pending to be applied when we receive the proposal
          setPendingVotes(prevPending => {
            const updated = {...prevPending};
            if (!updated[proposalId]) {
              updated[proposalId] = [];
            }
            updated[proposalId].push(event);
            return updated;
          });
          
          return prev;
        }
        
        // Parse the option index from content
        const optionIndex = parseInt(event.content);
        if (isNaN(optionIndex)) {
          console.error("Invalid vote option index:", event.content);
          return prev;
        }

        console.log(`Vote from ${event.pubkey} for proposal ${proposalId}, option ${optionIndex}`);
        
        // Update the votes
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
      setKickProposals(prev => {
        const proposalIndex = prev.findIndex(p => p.id === kickProposalId);
        if (proposalIndex < 0) return prev; // We don't have this proposal
        
        const updated = [...prev];
        const proposal = {...updated[proposalIndex]};
        
        // Add this vote if not already included
        if (!proposal.votes.includes(event.pubkey || '')) {
          proposal.votes = [...proposal.votes, event.pubkey || ''];
        }
        
        updated[proposalIndex] = proposal;
        return updated;
      });

      // Check if we should execute the kick (done separately to avoid timing issues)
      setKickProposals(prev => {
        const proposal = prev.find(p => p.id === kickProposalId);
        if (!proposal) return prev;

        // We must get the updated community to check if we have enough votes
        setCommunity(community => {
          if (community && (proposal.votes.length / community.members.length) >= 0.51) {
            // Execute the kick
            handleKickMember(proposal.targetMember).catch(e => {
              console.error("Error kicking member:", e);
            });
          }
          return community;
        });
        
        return prev;
      });
    } catch (e) {
      console.error("Error processing kick vote event:", e);
    }
  };

  return {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent,
    applyPendingVotes
  };
};
