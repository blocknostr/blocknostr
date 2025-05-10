
import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Community, Proposal, KickProposal } from "@/types/community";
import { useCommunityEventHandlers } from "./community/useCommunityEventHandlers";
import { useCommunityActions } from "./community/useCommunityActions";
import { useCommunitySubscriptions } from "./community/useCommunitySubscriptions";

export { Community, Proposal, KickProposal } from "@/types/community";

export const useCommunity = (communityId: string | undefined) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [kickProposals, setKickProposals] = useState<KickProposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUserPubkey = nostrService.publicKey;
  const isMember = community?.members.includes(currentUserPubkey || '') || false;
  const isCreator = community?.creator === currentUserPubkey;
  
  // Initialize event handlers
  const eventHandlers = useCommunityEventHandlers(
    community,
    setCommunity,
    proposals,
    setProposals,
    kickProposals,
    setKickProposals
  );
  
  // Initialize community actions
  const actions = useCommunityActions(
    community,
    setCommunity,
    currentUserPubkey
  );
  
  // Set up subscriptions
  useCommunitySubscriptions(communityId, eventHandlers, setLoading);
  
  return {
    community,
    proposals,
    kickProposals,
    loading,
    currentUserPubkey,
    isMember,
    isCreator,
    handleJoinCommunity: actions.handleJoinCommunity,
    handleCreateKickProposal: actions.handleCreateKickProposal,
    handleKickMember: eventHandlers.handleKickMember,
    handleVoteOnKick: actions.handleVoteOnKick
  };
};
