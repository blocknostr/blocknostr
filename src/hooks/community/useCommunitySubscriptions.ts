
import { NostrEvent, nostrService } from "@/lib/nostr";
import { useEffect } from "react";

export const useCommunitySubscriptions = (
  communityId: string | undefined,
  handleCommunityEvent: (event: NostrEvent) => void,
  handleProposalEvent: (event: NostrEvent) => void,
  handleVoteEvent: (event: NostrEvent) => void,
  handleKickProposalEvent: (event: NostrEvent) => void,
  handleKickVoteEvent: (event: NostrEvent) => void
) => {
  const loadCommunity = async () => {
    if (!communityId) return () => {};
    
    await nostrService.connectToUserRelays();
    
    // Subscribe to community events with this ID
    const communitySubscriptionObj = nostrService.subscribe(
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
    const proposalSubscriptions = loadProposals(communityId);
    
    // Load kick proposals for this community
    const kickSubscriptions = loadKickProposals(communityId);
    
    // Return a cleanup function that calls all the unsubscribe functions
    return () => {
      if (communitySubscriptionObj && typeof communitySubscriptionObj.unsubscribe === 'function') {
        communitySubscriptionObj.unsubscribe();
      }
      
      if (proposalSubscriptions) {
        if (proposalSubscriptions.proposalSubscriptionObj && 
            typeof proposalSubscriptions.proposalSubscriptionObj.unsubscribe === 'function') {
          proposalSubscriptions.proposalSubscriptionObj.unsubscribe();
        }
        
        if (proposalSubscriptions.votesSubscriptionObj && 
            typeof proposalSubscriptions.votesSubscriptionObj.unsubscribe === 'function') {
          proposalSubscriptions.votesSubscriptionObj.unsubscribe();
        }
      }
      
      if (kickSubscriptions) {
        if (kickSubscriptions.kickProposalSubscriptionObj && 
            typeof kickSubscriptions.kickProposalSubscriptionObj.unsubscribe === 'function') {
          kickSubscriptions.kickProposalSubscriptionObj.unsubscribe();
        }
        
        if (kickSubscriptions.kickVotesSubscriptionObj && 
            typeof kickSubscriptions.kickVotesSubscriptionObj.unsubscribe === 'function') {
          kickSubscriptions.kickVotesSubscriptionObj.unsubscribe();
        }
      }
    };
  };
  
  const loadProposals = (communityId: string) => {
    // Subscribe to proposal events for this community
    const proposalSubscriptionObj = nostrService.subscribe(
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
    const votesSubscriptionObj = nostrService.subscribe(
      [
        {
          kinds: [34552], // Vote events
          limit: 200
        }
      ],
      handleVoteEvent
    );
    
    return { proposalSubscriptionObj, votesSubscriptionObj };
  };
  
  const loadKickProposals = (communityId: string) => {
    const kickProposalSubscriptionObj = nostrService.subscribe(
      [
        {
          kinds: [34554], // Kick proposal kind
          '#e': [communityId],
          limit: 50
        }
      ],
      handleKickProposalEvent
    );
    
    const kickVotesSubscriptionObj = nostrService.subscribe(
      [
        {
          kinds: [34555], // Kick vote kind
          limit: 100
        }
      ],
      handleKickVoteEvent
    );
    
    return { kickProposalSubscriptionObj, kickVotesSubscriptionObj };
  };
  
  return {
    loadCommunity
  };
};
