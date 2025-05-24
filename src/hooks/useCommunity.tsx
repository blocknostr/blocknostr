
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { useCommunityEventHandlers } from "./community/useCommunityEventHandlers";
import { useCommunitySubscriptions } from "./community/useCommunitySubscriptions";
import { useCommunityActions } from "./community/useCommunityActions";
import { Community, Proposal, KickProposal, PendingVotes, MemberRole, InviteLink } from "@/types/community";
import { hasRole, canPerformAction } from "@/lib/community-permissions";

// Fix re-exporting with 'export type' for isolatedModules
export type { Community, Proposal, KickProposal } from "@/types/community";

export const useCommunity = (communityId: string | undefined) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [kickProposals, setKickProposals] = useState<KickProposal[]>([]);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberJoinTimes, setMemberJoinTimes] = useState<Record<string, number>>({});
  const [memberActions, setMemberActions] = useState<Record<string, { timestamp: number, type: string }[]>>({});
  
  const currentUserPubkey = nostrService.publicKey;
  
  // Community role and permissions
  const userRole: MemberRole | null = community ? 
    hasRole(currentUserPubkey, community.members, community.creator, community.moderators) : null;
  
  const isMember = userRole !== null;
  const isCreator = userRole === 'creator';
  const isModerator = userRole === 'moderator';
  const isCreatorOnlyMember = community?.members.length === 1 && isCreator;
  
  // Cache of vote events to handle votes that arrive before their proposals
  const [pendingVotes, setPendingVotes] = useState<PendingVotes>({});
  
  // Create community action handlers with extended functionality
  const {
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags
  } = useCommunityActions(community, setCommunity, currentUserPubkey, userRole);
  
  // Create event handlers
  const {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent,
    handleCommunityMetadataEvent,
    handleCommunityInviteEvent,
    handleCommunityRoleEvent,
    handleCommunityActivityEvent,
    applyPendingVotes
  } = useCommunityEventHandlers(
    setCommunity,
    setProposals,
    setKickProposals,
    setInviteLinks,
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
    handleKickVoteEvent,
    handleCommunityMetadataEvent,
    handleCommunityInviteEvent,
    handleCommunityRoleEvent,
    handleCommunityActivityEvent
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
  
  // Check permissions for common actions
  const canCreateProposal = community ? canPerformAction(
    'create_proposal',
    currentUserPubkey,
    community.members,
    community.creator,
    community.moderators,
    memberJoinTimes,
    community.minJoinTime
  ) : false;
  
  const canKickPropose = community ? canPerformAction(
    'kick_propose',
    currentUserPubkey,
    community.members,
    community.creator,
    community.moderators
  ) : false;
  
  const canModerate = community ? canPerformAction(
    'moderate',
    currentUserPubkey,
    community.members,
    community.creator,
    community.moderators
  ) : false;
  
  const canSetGuidelines = community ? canPerformAction(
    'set_guidelines',
    currentUserPubkey,
    community.members,
    community.creator,
    community.moderators
  ) : false;
  
  return {
    community,
    proposals,
    kickProposals,
    inviteLinks,
    loading,
    currentUserPubkey,
    
    // Roles and permissions
    isMember,
    isCreator,
    isModerator,
    isCreatorOnlyMember,
    userRole,
    canCreateProposal,
    canKickPropose,
    canModerate,
    canSetGuidelines,
    
    // Community actions
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleKickMember,
    handleVoteOnKick,
    handleDeleteCommunity,
    handleCreateInvite,
    handleSetPrivate,
    handleSetGuidelines,
    handleAddModerator,
    handleRemoveModerator,
    handleSetCommunityTags
  };
};
