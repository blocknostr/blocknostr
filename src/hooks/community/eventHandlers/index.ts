
import { NostrEvent } from "@/lib/nostr";
import { Community, KickProposal, Proposal, PendingVotes } from "@/types/community";
import { Dispatch, SetStateAction } from "react";
import { handleCommunityEvent } from "./communityEventHandler";
import { handleProposalEvent } from "./proposalEventHandler";
import { handleVoteEvent } from "./voteEventHandler";
import { handleKickProposalEvent } from "./kickProposalEventHandler";
import { handleKickVoteEvent } from "./kickVoteEventHandler";
import { usePendingVotesHandler } from "./pendingVotesHandler";

export const useCommunityEventHandlers = (
  setCommunity: Dispatch<SetStateAction<Community | null>>,
  setProposals: Dispatch<SetStateAction<Proposal[]>>,
  setKickProposals: Dispatch<SetStateAction<KickProposal[]>>,
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
    applyPendingVotes
  };
};

export {
  handleCommunityEvent,
  handleProposalEvent,
  handleVoteEvent,
  handleKickProposalEvent,
  handleKickVoteEvent,
  usePendingVotesHandler
};
