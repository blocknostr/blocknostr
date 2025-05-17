
import { useState, useEffect, useCallback } from 'react';
import { daoService } from '@/lib/dao/dao-service';
import { DAOProposal } from '@/types/dao';

export function useDAOKickProposals(daoId: string) {
  const [proposals, setProposals] = useState<DAOProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProposals = useCallback(async () => {
    if (!daoId) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedProposals = await daoService.getDAOKickProposals(daoId);
      setProposals(fetchedProposals);
    } catch (err) {
      console.error('Error fetching kick proposals:', err);
      setError('Failed to load kick proposals');
    } finally {
      setLoading(false);
    }
  }, [daoId]);
  
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);
  
  const voteOnProposal = async (proposalId: string, optionIndex: number) => {
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      if (success) {
        // Refetch proposals
        fetchProposals();
      }
      return success;
    } catch (err) {
      console.error('Error voting on kick proposal:', err);
      return false;
    }
  };
  
  return {
    proposals,
    loading,
    error,
    fetchProposals,
    voteOnProposal
  };
}
