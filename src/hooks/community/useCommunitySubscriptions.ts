
import { NostrEvent, nostrService, SubCloser } from "@/lib/nostr";

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
    const communitySubId = nostrService.subscribe(
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
    const proposalSubId = loadProposals(communityId);
    
    // Load kick proposals for this community
    const kickSubIds = loadKickProposals(communityId);
    
    return () => {
      nostrService.unsubscribe(communitySubId);
      if (proposalSubId) {
        nostrService.unsubscribe(proposalSubId.proposalSubId);
        nostrService.unsubscribe(proposalSubId.votesSubId);
      }
      if (kickSubIds) {
        nostrService.unsubscribe(kickSubIds.kickProposalSubId);
        nostrService.unsubscribe(kickSubIds.kickVotesSubId);
      }
    };
  };
  
  const loadProposals = (communityId: string) => {
    // Subscribe to proposal events for this community
    const proposalSubId = nostrService.subscribe(
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
    const votesSubId = nostrService.subscribe(
      [
        {
          kinds: [34552], // Vote events
          limit: 200
        }
      ],
      handleVoteEvent
    );
    
    return { proposalSubId, votesSubId };
  };
  
  const loadKickProposals = (communityId: string) => {
    const kickProposalSubId = nostrService.subscribe(
      [
        {
          kinds: [34554], // Kick proposal kind
          '#e': [communityId],
          limit: 50
        }
      ],
      handleKickProposalEvent
    );
    
    const kickVotesSubId = nostrService.subscribe(
      [
        {
          kinds: [34555], // Kick vote kind
          limit: 100
        }
      ],
      handleKickVoteEvent
    );
    
    return { kickProposalSubId, kickVotesSubId };
  };
  
  return {
    loadCommunity
  };
};
