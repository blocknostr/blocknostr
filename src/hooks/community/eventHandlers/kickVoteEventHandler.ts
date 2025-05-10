
import { NostrEvent } from "@/lib/nostr";
import { Community, KickProposal } from "@/types/community";
import { Dispatch, SetStateAction } from "react";

export const handleKickVoteEvent = (
  event: NostrEvent,
  setKickProposals: Dispatch<SetStateAction<KickProposal[]>>,
  setCommunity: Dispatch<SetStateAction<Community | null>>,
  handleKickMember: (memberToKick: string) => Promise<void>
): void => {
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
