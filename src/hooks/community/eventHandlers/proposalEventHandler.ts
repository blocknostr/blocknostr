
import { NostrEvent } from "@/lib/nostr";
import { Proposal } from "@/types/community";
import { Dispatch, SetStateAction } from "react";

export const handleProposalEvent = (
  event: NostrEvent,
  setProposals: Dispatch<SetStateAction<Proposal[]>>,
  applyPendingVotes: (proposalId: string) => void
): void => {
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
