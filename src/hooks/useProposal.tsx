
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Proposal } from "@/components/community/ProposalCard";

interface UseProposalProps {
  proposal: Proposal;
  currentUserPubkey: string | null;
  isMember: boolean;
  isCreator: boolean;
}

export const useProposal = ({
  proposal,
  currentUserPubkey,
  isMember,
  isCreator
}: UseProposalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localVotes, setLocalVotes] = useState<Record<string, number>>(proposal.votes || {});
  
  // Sync proposal votes with local votes when the proposal changes
  useEffect(() => {
    setLocalVotes(proposal.votes || {});
  }, [proposal.votes]);
  
  // Utility functions
  const getVoteCounts = () => {
    const counts = proposal.options.map(() => 0);
    
    Object.entries(localVotes).forEach(([_, optionIndex]) => {
      const index = typeof optionIndex === 'number' ? optionIndex : parseInt(optionIndex as string);
      if (index >= 0 && index < counts.length) {
        counts[index]++;
      }
    });
    
    return counts;
  };
  
  const getTotalVotes = () => {
    return Object.keys(localVotes).length;
  };
  
  const getUserVote = () => {
    if (!currentUserPubkey) return -1;
    const vote = localVotes[currentUserPubkey];
    return vote !== undefined ? Number(vote) : -1;
  };
  
  const getAllVoters = () => {
    return Object.keys(localVotes);
  };
  
  const isProposalActive = () => {
    return proposal.endsAt > Math.floor(Date.now() / 1000);
  };
  
  const handleVote = async (optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return;
    }
    
    if (!isMember && !isCreator) {
      toast.error("You must be a member of this community to vote");
      return;
    }
    
    // Check if user already voted for this option
    if (getUserVote() === optionIndex) {
      toast.info("You already voted for this option");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const eventId = await nostrService.voteOnProposal(proposal.id, optionIndex);
      
      if (eventId) {
        // Update local state immediately for better UX
        setLocalVotes(prev => ({
          ...prev,
          [currentUserPubkey]: optionIndex
        }));
        toast.success("Vote recorded!");
        
        // Log for debugging
        console.log("Vote published with event ID:", eventId);
        console.log("Updated local votes:", {
          ...localVotes,
          [currentUserPubkey]: optionIndex
        });
      } else {
        toast.error("Failed to publish vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate values
  const voteCounts = getVoteCounts();
  const totalVotes = getTotalVotes();
  const userVote = getUserVote();
  const isActive = isProposalActive();
  const allVoters = getAllVoters();
  const selectedOption = userVote !== -1 ? proposal.options[userVote] : null;
  
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
};
