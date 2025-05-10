
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useCommunityEventHandlers } from "./community/useCommunityEventHandlers";
import { useCommunitySubscriptions } from "./community/useCommunitySubscriptions";
import { useCommunityActions } from "./community/useCommunityActions";

// Fix re-exporting with 'export type' for isolatedModules
export type { Community, Proposal, KickProposal } from "@/types/community";

export const useCommunity = (communityId: string | undefined) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [kickProposals, setKickProposals] = useState<KickProposal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const currentUserPubkey = nostrService.publicKey;
  const isMember = community?.members.includes(currentUserPubkey || '') || false;
  const isCreator = community?.creator === currentUserPubkey;
  const isCreatorOnlyMember = community?.members.length === 1 && isCreator;
  
  // Cache of vote events to handle votes that arrive before their proposals
  const [pendingVotes, setPendingVotes] = useState<PendingVotes>({});
  
  // Create community action handlers
  const {
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity
  } = useCommunityActions(community, setCommunity, currentUserPubkey);
  
  // Create event handlers
  const {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent,
    applyPendingVotes
  } = useCommunityEventHandlers(
    setCommunity,
    setProposals,
    setKickProposals,
    pendingVotes,
    setPendingVotes,
    handleKickMember
  );
  
  // Create subscription handlers
  const { loadCommunity } = useCommunitySubscriptions(
    communityId,
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent
  );
  
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initCommunity = async () => {
      setLoading(true);
      cleanup = await loadCommunity();
      setLoading(false);
    };
    
    initCommunity();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [communityId]);
  
  return {
    community,
    proposals,
    kickProposals,
    loading,
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity
  };
};
