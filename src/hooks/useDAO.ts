
import { useState, useEffect, useCallback } from 'react';
import { nostrService } from '@/lib/nostr';
import { daoService } from '@/lib/dao/dao-service';
import { DAO, DAOProposal } from '@/types/dao';
import { toast } from 'sonner';

export function useDAO() {
  const [daos, setDAOs] = useState<DAO[]>([]);
  const [myDaos, setMyDaos] = useState<DAO[]>([]);
  const [trendingDaos, setTrendingDaos] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyDaos, setLoadingMyDaos] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(null);

  // Get current user's pubkey
  useEffect(() => {
    setCurrentUserPubkey(nostrService.publicKey);
  }, []);

  // Fetch general DAOs
  const fetchGeneralDAOs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedDaos = await daoService.getDAOs();
      setDAOs(fetchedDaos);
    } catch (err) {
      console.error('Error fetching DAOs:', err);
      setError('Failed to fetch DAOs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's DAOs
  const fetchMyDAOs = useCallback(async () => {
    if (!currentUserPubkey) {
      setMyDaos([]);
      setLoadingMyDaos(false);
      return;
    }
    
    try {
      setLoadingMyDaos(true);
      setError(null);
      const fetchedDaos = await daoService.getUserDAOs(currentUserPubkey);
      setMyDaos(fetchedDaos);
    } catch (err) {
      console.error('Error fetching user DAOs:', err);
      setError('Failed to fetch your DAOs');
    } finally {
      setLoadingMyDaos(false);
    }
  }, [currentUserPubkey]);

  // Fetch trending DAOs
  const fetchTrendingDAOs = useCallback(async () => {
    try {
      setLoadingTrending(true);
      setError(null);
      const fetchedDaos = await daoService.getTrendingDAOs();
      setTrendingDaos(fetchedDaos);
    } catch (err) {
      console.error('Error fetching trending DAOs:', err);
      setError('Failed to fetch trending DAOs');
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  // Load all DAOs on initial load
  useEffect(() => {
    fetchGeneralDAOs();
  }, [fetchGeneralDAOs]);

  // Create DAO
  const createDAO = useCallback(async (name: string, description: string, tags: string[] = []) => {
    if (!currentUserPubkey) {
      toast.error('Please login to create a DAO');
      return null;
    }
    
    try {
      const daoId = await daoService.createDAO(name, description, tags);
      
      if (daoId) {
        toast.success('DAO created successfully!');
        // Refresh the lists
        fetchMyDAOs();
        fetchGeneralDAOs();
      } else {
        toast.error('Failed to create DAO');
      }
      
      return daoId;
    } catch (err) {
      console.error('Error creating DAO:', err);
      toast.error('Error creating DAO');
      return null;
    }
  }, [currentUserPubkey, fetchMyDAOs, fetchGeneralDAOs]);

  // Join DAO
  const joinDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error('Please login to join a DAO');
      return false;
    }
    
    try {
      const success = await daoService.joinDAO(daoId);
      
      if (success) {
        toast.success('Successfully joined DAO!');
        // Refresh the lists
        fetchMyDAOs();
        return true;
      } else {
        toast.error('Failed to join DAO');
        return false;
      }
    } catch (err) {
      console.error('Error joining DAO:', err);
      toast.error('Error joining DAO');
      return false;
    }
  }, [currentUserPubkey, fetchMyDAOs]);

  // Leave DAO
  const leaveDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error('Please login to leave a DAO');
      return false;
    }
    
    try {
      const success = await daoService.leaveDAO(daoId);
      
      if (success) {
        toast.success('Successfully left DAO');
        // Refresh the lists
        fetchMyDAOs();
        return true;
      } else {
        toast.error('Failed to leave DAO');
        return false;
      }
    } catch (err) {
      console.error('Error leaving DAO:', err);
      toast.error('Error leaving DAO');
      return false;
    }
  }, [currentUserPubkey, fetchMyDAOs]);

  // Create proposal
  const createProposal = useCallback(async (daoId: string, title: string, description: string, options: string[], durationDays: number = 7) => {
    if (!currentUserPubkey) {
      toast.error('Please login to create a proposal');
      return null;
    }
    
    try {
      const proposalId = await daoService.createProposal(
        daoId,
        title,
        description,
        options,
        durationDays
      );
      
      if (proposalId) {
        toast.success('Proposal created successfully!');
        return proposalId;
      } else {
        toast.error('Failed to create proposal');
        return null;
      }
    } catch (err) {
      console.error('Error creating proposal:', err);
      toast.error('Error creating proposal');
      return null;
    }
  }, [currentUserPubkey]);

  // Vote on proposal
  const voteOnProposal = useCallback(async (proposalId: string, optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error('Please login to vote');
      return false;
    }
    
    try {
      const success = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (success) {
        toast.success('Vote recorded successfully!');
        return true;
      } else {
        toast.error('Failed to record vote');
        return false;
      }
    } catch (err) {
      console.error('Error voting on proposal:', err);
      toast.error('Error voting on proposal');
      return false;
    }
  }, [currentUserPubkey]);

  // Delete DAO
  const deleteDAO = useCallback(async (daoId: string) => {
    if (!currentUserPubkey) {
      toast.error('Please login to delete a DAO');
      return false;
    }
    
    try {
      const success = await daoService.deleteDAO(daoId);
      
      if (success) {
        toast.success('DAO deleted successfully');
        // Refresh the lists
        fetchMyDAOs();
        fetchGeneralDAOs();
        return true;
      } else {
        toast.error('Failed to delete DAO');
        return false;
      }
    } catch (err) {
      console.error('Error deleting DAO:', err);
      toast.error('Error deleting DAO');
      return false;
    }
  }, [currentUserPubkey, fetchMyDAOs, fetchGeneralDAOs]);

  // Create kick proposal
  const createKickProposal = useCallback(async (daoId: string, memberToKick: string, reason: string) => {
    if (!currentUserPubkey) {
      toast.error('Please login to create a kick proposal');
      return null;
    }
    
    try {
      const proposalId = await daoService.createKickProposal(
        daoId,
        memberToKick,
        reason
      );
      
      if (proposalId) {
        toast.success('Kick proposal created successfully!');
        return proposalId;
      } else {
        toast.error('Failed to create kick proposal');
        return null;
      }
    } catch (err) {
      console.error('Error creating kick proposal:', err);
      toast.error('Error creating kick proposal');
      return null;
    }
  }, [currentUserPubkey]);

  // Refresh all DAO data
  const refreshDaos = useCallback(async () => {
    await Promise.all([
      fetchGeneralDAOs(),
      fetchMyDAOs(),
      fetchTrendingDAOs()
    ]);
  }, [fetchGeneralDAOs, fetchMyDAOs, fetchTrendingDAOs]);

  return {
    daos,
    myDaos,
    trendingDaos,
    loading,
    loadingMyDaos,
    loadingTrending,
    error,
    currentUserPubkey,
    createDAO,
    joinDAO,
    leaveDAO,
    createProposal,
    voteOnProposal,
    deleteDAO,
    createKickProposal,
    refreshDaos,
    fetchGeneralDAOs,
    fetchMyDAOs,
    fetchTrendingDAOs
  };
}
