
import { NostrEvent } from "@/lib/nostr";
import { Proposal, PendingVotes } from "@/types/community";
import { Dispatch, SetStateAction, useCallback } from "react";

export const usePendingVotesHandler = (
  pendingVotes: PendingVotes,
  setPendingVotes: Dispatch<SetStateAction<PendingVotes>>,
  setProposals: Dispatch<SetStateAction<Proposal[]>>
) => {
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
  
  return { applyPendingVotes };
};
