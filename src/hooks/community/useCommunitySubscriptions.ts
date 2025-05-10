
import { useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

export const useCommunitySubscriptions = (
  communityId: string | undefined,
  handleCommunityEvent: (event: NostrEvent) => void,
  handleProposalEvent: (event: NostrEvent) => void,
  handleVoteEvent: (event: NostrEvent) => void,
  handleKickProposalEvent: (event: NostrEvent) => void,
  handleKickVoteEvent: (event: NostrEvent) => void
) => {
  useEffect(() => {
    if (!communityId) return;
    
    let cleanupFunctions: Array<() => void> = [];
    
    const initSubscriptions = async () => {
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
      
      cleanupFunctions.push(() => nostrService.unsubscribe(communitySubId));
      
      // Load proposals for this community
      const proposalSubIds = loadProposals(communityId);
      cleanupFunctions.push(proposalSubIds);
      
      // Load kick proposals for this community
      const kickSubIds = loadKickProposals(communityId);
      cleanupFunctions.push(kickSubIds);
    };
    
    initSubscriptions();
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [communityId, handleCommunityEvent, handleProposalEvent, handleVoteEvent, handleKickProposalEvent, handleKickVoteEvent]);
  
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
    
    return () => {
      nostrService.unsubscribe(proposalSubId);
      nostrService.unsubscribe(votesSubId);
    };
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
    
    return () => {
      nostrService.unsubscribe(kickProposalSubId);
      nostrService.unsubscribe(kickVotesSubId);
    };
  };
  
  return {
    loadCommunity: async () => {
      if (!communityId) return;
      await nostrService.connectToUserRelays();
    }
  };
};
