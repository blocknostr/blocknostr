
import { NostrEvent } from "@/lib/nostr";
import { Proposal, PendingVotes } from "@/types/community";
import { Dispatch, SetStateAction } from "react";

export const handleVoteEvent = (
  event: NostrEvent,
  setProposals: Dispatch<SetStateAction<Proposal[]>>,
  setPendingVotes: Dispatch<SetStateAction<PendingVotes>>
): void => {
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
