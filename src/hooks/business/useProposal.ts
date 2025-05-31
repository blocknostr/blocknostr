import { useState, useEffect, useMemo } from 'react';
import { Proposal } from '@/api/types/community';

interface UseProposalParams {
  proposal: Proposal;
  currentUserPubkey: string | null;
  isMember: boolean;
  isCreator: boolean;
}

interface UseProposalReturn {
  isSubmitting: boolean;
  voteCounts: number[];
  totalVotes: number;
  userVote: number | null;
  isActive: boolean;
  allVoters: string[];
  selectedOption: number | null;
  handleVote: (optionIndex: number) => Promise<void>;
}

export function useProposal({
  proposal,
  currentUserPubkey,
  isMember,
  isCreator
}: UseProposalParams): UseProposalReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Calculate vote counts for each option
  const voteCounts = useMemo(() => {
    const counts = new Array(proposal.options.length).fill(0);
    
    // Count votes for each option
    Object.values(proposal.votes).forEach(optionIndex => {
      if (optionIndex >= 0 && optionIndex < proposal.options.length) {
        counts[optionIndex]++;
      }
    });
    
    return counts;
  }, [proposal.votes, proposal.options.length]);

  // Calculate total votes
  const totalVotes = useMemo(() => {
    return Object.keys(proposal.votes).length;
  }, [proposal.votes]);

  // Get current user's vote
  const userVote = useMemo(() => {
    if (!currentUserPubkey || !proposal.votes[currentUserPubkey]) {
      return null;
    }
    return proposal.votes[currentUserPubkey];
  }, [proposal.votes, currentUserPubkey]);

  // Check if proposal is still active
  const isActive = useMemo(() => {
    return Date.now() < proposal.endsAt * 1000;
  }, [proposal.endsAt]);

  // Get all voters
  const allVoters = useMemo(() => {
    return Object.keys(proposal.votes);
  }, [proposal.votes]);

  // Handle voting
  const handleVote = async (optionIndex: number) => {
    if (!currentUserPubkey || !isMember || !isActive || isSubmitting) {
      return;
    }

    if (optionIndex < 0 || optionIndex >= proposal.options.length) {
      console.error('Invalid option index:', optionIndex);
      return;
    }

    setIsSubmitting(true);
    setSelectedOption(optionIndex);

    try {
      // TODO: Implement actual voting logic with DAO service
      console.log('Voting on proposal:', {
        proposalId: proposal.id,
        optionIndex,
        userPubkey: currentUserPubkey
      });

      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Update proposal votes in the backend
      // This would typically involve:
      // 1. Creating a Nostr vote event
      // 2. Publishing it to relays
      // 3. Updating local state
      
      console.log('Vote submitted successfully');
    } catch (error) {
      console.error('Error voting on proposal:', error);
    } finally {
      setIsSubmitting(false);
      setSelectedOption(null);
    }
  };

  return {
    isSubmitting,
    voteCounts,
    totalVotes,
    userVote,
    isActive,
    allVoters,
    selectedOption,
    handleVote
  };
} 
