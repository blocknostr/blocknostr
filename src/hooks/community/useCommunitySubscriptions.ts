
import { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { CommunityEventHandlersResult } from "./useCommunityEventHandlers";

export const useCommunitySubscriptions = (
  communityId: string | undefined,
  eventHandlers: CommunityEventHandlersResult,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) return;
      
      setLoading(true);
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
        eventHandlers.handleCommunityEvent
      );
      
      // Load proposals for this community
      const proposalSubId = nostrService.subscribe(
        [
          {
            kinds: [34551],
            '#e': [communityId],
            limit: 50
          }
        ],
        eventHandlers.handleProposalEvent
      );
      
      // Load votes for proposals
      const votesSubId = nostrService.subscribe(
        [
          {
            kinds: [34552],
            limit: 100
          }
        ],
        eventHandlers.handleVoteEvent
      );
      
      // Load kick proposals for this community
      const kickProposalSubId = nostrService.subscribe(
        [
          {
            kinds: [34554], // Kick proposal kind
            '#e': [communityId],
            limit: 50
          }
        ],
        eventHandlers.handleKickProposalEvent
      );
      
      // Load kick votes
      const kickVotesSubId = nostrService.subscribe(
        [
          {
            kinds: [34555], // Kick vote kind
            limit: 100
          }
        ],
        eventHandlers.handleKickVoteEvent
      );
      
      return () => {
        nostrService.unsubscribe(communitySubId);
        nostrService.unsubscribe(proposalSubId);
        nostrService.unsubscribe(votesSubId);
        nostrService.unsubscribe(kickProposalSubId);
        nostrService.unsubscribe(kickVotesSubId);
      };
    };
    
    loadCommunity();
  }, [communityId]);
};
