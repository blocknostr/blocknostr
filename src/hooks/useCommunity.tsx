
import { useEffect, useState } from 'react';
import { nostrService, NostrEvent } from '@/lib/nostr';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { Community } from '@/types/community';
import { useCommunityEventHandlers } from './community/useCommunityEventHandlers';
import { useCommunitySubscriptions } from './community/useCommunitySubscriptions';

export function useCommunity(communityId: string | undefined) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent, 
    handleKickVoteEvent,
    proposals,
    votes,
    kickProposals,
    kickVotes,
    members
  } = useCommunityEventHandlers();

  const { loadCommunity } = useCommunitySubscriptions(
    communityId,
    handleCommunityEvent,
    handleProposalEvent,
    handleVoteEvent,
    handleKickProposalEvent,
    handleKickVoteEvent
  );

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      setError('Community ID is required');
      return;
    }

    let unsubscribe: (() => void) | undefined;
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        unsubscribe = await loadCommunity();
      } catch (err) {
        console.error('Error loading community:', err);
        setError('Failed to load community');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
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
    members
  };
}
