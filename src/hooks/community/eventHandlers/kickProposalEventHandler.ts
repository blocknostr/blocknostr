
import { NostrEvent } from "@/lib/nostr";
import { KickProposal } from "@/types/community";
import { Dispatch, SetStateAction } from "react";

export const handleKickProposalEvent = (
  event: NostrEvent,
  setKickProposals: Dispatch<SetStateAction<KickProposal[]>>
): void => {
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
