
import { NostrEvent } from "@/lib/nostr";
import { Community, KickProposal, Proposal, PendingVotes, InviteLink } from "@/types/community";
import { Dispatch, SetStateAction } from "react";
import { handleCommunityEvent } from "./communityEventHandler";
import { handleProposalEvent } from "./proposalEventHandler";
import { handleVoteEvent } from "./voteEventHandler";
import { handleKickProposalEvent } from "./kickProposalEventHandler";
import { handleKickVoteEvent } from "./kickVoteEventHandler";
import { usePendingVotesHandler } from "./pendingVotesHandler";

// Add new handlers for the additional event types
const handleCommunityMetadataEvent = (event: NostrEvent, setCommunity: Dispatch<SetStateAction<Community | null>>) => {
  try {
    const content = JSON.parse(event.content);
    
    setCommunity(prevCommunity => {
      if (!prevCommunity) return null;
      
      switch (content.type) {
        case 'guidelines':
          return { ...prevCommunity, guidelines: content.content };
        case 'private':
          return { ...prevCommunity, isPrivate: content.content };
        case 'tags':
          return { ...prevCommunity, tags: content.content };
        default:
          return prevCommunity;
      }
    });
  } catch (error) {
    console.error("Error handling community metadata event:", error);
  }
};

const handleCommunityInviteEvent = (event: NostrEvent, setInviteLinks: Dispatch<SetStateAction<InviteLink[]>>) => {
  try {
    const content = JSON.parse(event.content);
    const communityId = event.tags.find(tag => tag[0] === 'e')?.[1];
    
    if (!communityId) return;
    
    const inviteLink: InviteLink = {
      id: event.id,
      communityId,
      creatorPubkey: event.pubkey,
      createdAt: content.createdAt || event.created_at,
      expiresAt: content.expiresAt,
      maxUses: content.maxUses,
      usedCount: content.usedCount || 0
    };
    
    setInviteLinks(prevLinks => {
      const existingLinkIndex = prevLinks.findIndex(link => link.id === event.id);
      
      if (existingLinkIndex >= 0) {
        const updatedLinks = [...prevLinks];
        updatedLinks[existingLinkIndex] = inviteLink;
        return updatedLinks;
      } else {
        return [...prevLinks, inviteLink];
      }
    });
  } catch (error) {
    console.error("Error handling community invite event:", error);
  }
};

const handleCommunityRoleEvent = (event: NostrEvent, setCommunity: Dispatch<SetStateAction<Community | null>>) => {
  try {
    const content = JSON.parse(event.content);
    const { role, action } = content;
    
    // Get the target pubkey from the p tag with role attribute
    const targetTag = event.tags.find(tag => tag[0] === 'p' && tag[2] === role);
    if (!targetTag) return;
    
    const targetPubkey = targetTag[1];
    
    setCommunity(prevCommunity => {
      if (!prevCommunity) return null;
      
      if (role === 'moderator') {
        const moderators = prevCommunity.moderators || [];
        
        if (action === 'add') {
          if (!moderators.includes(targetPubkey)) {
            return { ...prevCommunity, moderators: [...moderators, targetPubkey] };
          }
        } else if (action === 'remove') {
          return { ...prevCommunity, moderators: moderators.filter(mod => mod !== targetPubkey) };
        }
      }
      
      return prevCommunity;
    });
  } catch (error) {
    console.error("Error handling community role event:", error);
  }
};

const handleCommunityActivityEvent = (event: NostrEvent) => {
  // For future implementation
  console.log("Received community activity event:", event);
};

export const useCommunityEventHandlers = (
  setCommunity: Dispatch<SetStateAction<Community | null>>,
  setProposals: Dispatch<SetStateAction<Proposal[]>>,
  setKickProposals: Dispatch<SetStateAction<KickProposal[]>>,
  setInviteLinks: Dispatch<SetStateAction<InviteLink[]>>,
  pendingVotes: PendingVotes,
  setPendingVotes: Dispatch<SetStateAction<PendingVotes>>,
  handleKickMember: (memberToKick: string) => Promise<void>
) => {
  // Get the pending votes handler
  const { applyPendingVotes } = usePendingVotesHandler(pendingVotes, setPendingVotes, setProposals);

  return {
    handleCommunityEvent: (event: NostrEvent) => handleCommunityEvent(event, setCommunity),
    handleProposalEvent: (event: NostrEvent) => handleProposalEvent(event, setProposals, applyPendingVotes),
    handleVoteEvent: (event: NostrEvent) => handleVoteEvent(event, setProposals, setPendingVotes),
    handleKickProposalEvent: (event: NostrEvent) => handleKickProposalEvent(event, setKickProposals),
    handleKickVoteEvent: (event: NostrEvent) => handleKickVoteEvent(event, setKickProposals, setCommunity, handleKickMember),
    handleCommunityMetadataEvent: (event: NostrEvent) => handleCommunityMetadataEvent(event, setCommunity),
    handleCommunityInviteEvent: (event: NostrEvent) => handleCommunityInviteEvent(event, setInviteLinks),
    handleCommunityRoleEvent: (event: NostrEvent) => handleCommunityRoleEvent(event, setCommunity),
    handleCommunityActivityEvent,
    applyPendingVotes
  };
};

export {
  handleCommunityEvent,
  handleProposalEvent,
  handleVoteEvent,
  handleKickProposalEvent,
  handleKickVoteEvent,
  handleCommunityMetadataEvent,
  handleCommunityInviteEvent,
  handleCommunityRoleEvent,
  handleCommunityActivityEvent,
  usePendingVotesHandler
};
