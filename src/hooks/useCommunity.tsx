
import { useEffect, useState } from 'react';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { Community } from '@/types/community';
import { useCommunityEventHandlers } from './community/useCommunityEventHandlers';
import { useCommunitySubscriptions } from './community/useCommunitySubscriptions';
import { useCommunityActions } from './community/useCommunityActions';

export function useCommunity(communityId: string | undefined) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const eventHandlers = useCommunityEventHandlers();
  const { proposals, votes, kickProposals, kickVotes, members } = eventHandlers;

  const { loadCommunity } = useCommunitySubscriptions(
    communityId,
    eventHandlers.handleCommunityEvent,
    eventHandlers.handleProposalEvent,
    eventHandlers.handleVoteEvent,
    eventHandlers.handleKickProposalEvent,
    eventHandlers.handleKickVoteEvent
  );

  // Get community actions
  const {
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity
  } = useCommunityActions(community);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      setError('Community ID is required');
      return;
    }

    let cleanup: (() => void) | undefined;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        cleanup = await loadCommunity();
      } catch (err) {
        console.error('Error loading community:', err);
        setError('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [communityId]);

  return {
    community,
    setCommunity,
    loading,
    error,
    proposals,
    votes,
    kickProposals,
    kickVotes,
    members,
    currentUserPubkey,
    isMember,
    isCreator,
    isCreatorOnlyMember,
    handleJoinCommunity,
    handleLeaveCommunity,
    handleCreateKickProposal,
    handleVoteOnKick,
    handleDeleteCommunity
  };
}
