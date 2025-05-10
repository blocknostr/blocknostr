
import { useState } from 'react';
import { NostrEvent } from '@/lib/nostr';

export const useCommunityEventHandlers = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [kickProposals, setKickProposals] = useState<any[]>([]);
  const [kickVotes, setKickVotes] = useState<any[]>([]);
  const [members, setMembers] = useState<string[]>([]);

  const handleCommunityEvent = (event: NostrEvent) => {
    try {
      const communityData = JSON.parse(event.content);
      const memberTags = event.tags.filter(tag => tag[0] === 'p').map(tag => tag[1]);
      
      setMembers(memberTags);
      
      console.log("Processed community event", { communityData, memberTags });
    } catch (error) {
      console.error("Error processing community event:", error);
    }
  };

  const handleProposalEvent = (event: NostrEvent) => {
    try {
      const proposalData = JSON.parse(event.content);
      const newProposal = {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        communityId: event.tags.find(tag => tag[0] === 'e')?.[1],
        ...proposalData
      };
      
      setProposals(prev => {
        const exists = prev.some(p => p.id === event.id);
        if (exists) return prev;
        return [...prev, newProposal];
      });
      
      console.log("Processed proposal event", newProposal);
    } catch (error) {
      console.error("Error processing proposal event:", error);
    }
  };

  const handleVoteEvent = (event: NostrEvent) => {
    try {
      const proposalId = event.tags.find(tag => tag[0] === 'e')?.[1];
      if (!proposalId) return;
      
      const newVote = {
        id: event.id,
        proposalId,
        pubkey: event.pubkey,
        optionIndex: parseInt(event.content),
        created_at: event.created_at
      };
      
      setVotes(prev => {
        const exists = prev.some(v => v.id === event.id);
        if (exists) return prev;
        return [...prev, newVote];
      });
      
      console.log("Processed vote event", newVote);
    } catch (error) {
      console.error("Error processing vote event:", error);
    }
  };

  const handleKickProposalEvent = (event: NostrEvent) => {
    try {
      const kickData = JSON.parse(event.content);
      const communityId = event.tags.find(tag => tag[0] === 'e')?.[1];
      const targetPubkey = event.tags.find(tag => tag[0] === 'p')?.[1];
      
      if (!communityId || !targetPubkey) return;
      
      const newKickProposal = {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        communityId,
        targetPubkey,
        ...kickData
      };
      
      setKickProposals(prev => {
        const exists = prev.some(p => p.id === event.id);
        if (exists) return prev;
        return [...prev, newKickProposal];
      });
      
      console.log("Processed kick proposal event", newKickProposal);
    } catch (error) {
      console.error("Error processing kick proposal event:", error);
    }
  };

  const handleKickVoteEvent = (event: NostrEvent) => {
    try {
      const kickProposalId = event.tags.find(tag => tag[0] === 'e')?.[1];
      if (!kickProposalId) return;
      
      const newKickVote = {
        id: event.id,
        kickProposalId,
        pubkey: event.pubkey,
        vote: event.content === '1' ? 'yes' : 'no',
        created_at: event.created_at
      };
      
      setKickVotes(prev => {
        const exists = prev.some(v => v.id === event.id);
        if (exists) return prev;
        return [...prev, newKickVote];
      });
      
      console.log("Processed kick vote event", newKickVote);
    } catch (error) {
      console.error("Error processing kick vote event:", error);
    }
  };
  
  const applyPendingVotes = (proposalId: string) => {
    // Implementation to apply pending votes to a proposal
    console.log("Applying pending votes for proposal", proposalId);
  };

  return {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent,
    applyPendingVotes,
    proposals,
    votes,
    kickProposals,
    kickVotes,
    members
  };
};
