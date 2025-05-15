
import { useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";

export const useCommunitySubscriptions = (
  communityId: string | undefined,
  handleCommunityEvent: (event: NostrEvent) => void,
  handleProposalEvent: (event: NostrEvent) => void,
  handleVoteEvent: (event: NostrEvent) => void,
  handleKickProposalEvent: (event: NostrEvent) => void,
  handleKickVoteEvent: (event: NostrEvent) => void,
  handleCommunityMetadataEvent?: (event: NostrEvent) => void,
  handleCommunityInviteEvent?: (event: NostrEvent) => void,
  handleCommunityRoleEvent?: (event: NostrEvent) => void,
  handleCommunityActivityEvent?: (event: NostrEvent) => void
) => {
  const loadCommunity = async () => {
    if (!communityId) return;
    
    await nostrService.connectToUserRelays();
    
    // Track all subscription IDs for proper cleanup
    const subscriptionIds: string[] = [];
    
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
    subscriptionIds.push(communitySubId);
    
    // Load proposals for this community
    const proposalSubIds = loadProposals(communityId);
    subscriptionIds.push(...Object.values(proposalSubIds));
    
    // Load kick proposals for this community
    const kickSubIds = loadKickProposals(communityId);
    subscriptionIds.push(...Object.values(kickSubIds));
    
    // Load community metadata events
    const metadataSubIds = loadCommunityMetadata(communityId);
    subscriptionIds.push(...Object.values(metadataSubIds).filter(Boolean) as string[]);
    
    return () => {
      // Clean up all subscriptions on unmount
      subscriptionIds.forEach(subId => {
        if (subId) nostrService.unsubscribe(subId);
      });
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
  
  const loadCommunityMetadata = (communityId: string) => {
    let metadataSubId, inviteSubId, roleSubId, activitySubId;
    
    // Subscribe to community metadata events
    if (handleCommunityMetadataEvent) {
      metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [34556], // Community metadata kind
            '#e': [communityId],
            limit: 50
          }
        ],
        handleCommunityMetadataEvent
      );
    }
    
    // Subscribe to community invite events
    if (handleCommunityInviteEvent) {
      inviteSubId = nostrService.subscribe(
        [
          {
            kinds: [34557], // Community invite kind
            '#e': [communityId],
            limit: 50
          }
        ],
        handleCommunityInviteEvent
      );
    }
    
    // Subscribe to community role events
    if (handleCommunityRoleEvent) {
      roleSubId = nostrService.subscribe(
        [
          {
            kinds: [34558], // Community role kind
            '#e': [communityId],
            limit: 50
          }
        ],
        handleCommunityRoleEvent
      );
    }
    
    // Subscribe to community activity events
    if (handleCommunityActivityEvent) {
      activitySubId = nostrService.subscribe(
        [
          {
            kinds: [34559], // Community activity kind
            '#e': [communityId],
            limit: 100
          }
        ],
        handleCommunityActivityEvent
      );
    }
    
    return { 
      metadataSubId, 
      inviteSubId, 
      roleSubId, 
      activitySubId 
    };
  };
  
  return {
    loadCommunity
  };
};
