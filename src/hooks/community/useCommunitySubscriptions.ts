
import type { NostrEvent, SubCloser } from "@/lib/nostr/types";
import { nostrService } from "@/lib/nostr";

export const useCommunitySubscriptions = (
  communityId: string | undefined,
  handleCommunityEvent: (event: NostrEvent) => void,
  handleProposalEvent: (event: NostrEvent) => void,
  handleVoteEvent: (event: NostrEvent) => void,
  handleKickProposalEvent: (event: NostrEvent) => void,
  handleKickVoteEvent: (event: NostrEvent) => void
) => {
  const loadCommunity = async () => {
    if (!communityId) return;
    
    await nostrService.connectToUserRelays();
    
    // Subscribe to community events with this ID
    const communitySubCloser = nostrService.subscribe(
      [
        {
          kinds: [34550],
          ids: [communityId],
          limit: 1
        }
      ],
      handleCommunityEvent
    );
    
    // Load proposals for this community
    const proposalSubs = loadProposals(communityId);
    
    // Load kick proposals for this community
    const kickSubs = loadKickProposals(communityId);
    
    return () => {
      nostrService.unsubscribe(communitySubCloser);
      if (proposalSubs) {
        nostrService.unsubscribe(proposalSubs.proposalSubCloser);
        nostrService.unsubscribe(proposalSubs.votesSubCloser);
      }
      if (kickSubs) {
        nostrService.unsubscribe(kickSubs.kickProposalSubCloser);
        nostrService.unsubscribe(kickSubs.kickVotesSubCloser);
      }
    };
  };
  
  const loadProposals = (communityId: string) => {
    // Subscribe to proposal events for this community
    const proposalSubCloser = nostrService.subscribe(
      [
        {
          kinds: [34551],
          '#e': [communityId],
          limit: 50
        }
      ],
      handleProposalEvent
    );
    
    // Subscribe to vote events
    const votesSubCloser = nostrService.subscribe(
      [
        {
          kinds: [34552], // Vote events
          limit: 200
        }
      ],
      handleVoteEvent
    );
    
    return { proposalSubCloser, votesSubCloser };
  };
  
  const loadKickProposals = (communityId: string) => {
    const kickProposalSubCloser = nostrService.subscribe(
      [
        {
          kinds: [34554], // Kick proposal kind
          '#e': [communityId],
          limit: 50
        }
      ],
      handleKickProposalEvent
    );
    
    const kickVotesSubCloser = nostrService.subscribe(
      [
        {
          kinds: [34555], // Kick vote kind
          limit: 100
        }
      ],
      handleKickVoteEvent
    );
    
    return { kickProposalSubCloser, kickVotesSubCloser };
  };
  
  return {
    loadCommunity
  };
};
