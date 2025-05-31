import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import {
  useGetDAOsQuery,
  useGetMyDAOsQuery,
  useGetTrendingDAOsQuery,
  useGetDAOByIdQuery,
  useCreateDAOMutation,
  useJoinDAOMutation,
  useLeaveDAOMutation,
  useGetProposalsByDAOQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useVoteOnProposalMutation,
} from '@/api/rtk/daoApi';
import {
  fetchDAOs,
  fetchMyDAOs,
  fetchTrendingDAOs,
  fetchDAOById,
  createDAO,
  joinDAO,
  leaveDAO,
  selectDAOById,
  selectTrendingDAOs,
  selectMyDAOs,
  selectSearchResults,
  selectDAOMetrics,
  selectCurrentDAO,
  clearSearch,
  setCurrentDAO,
} from '@/store/slices/daoCommunitiesSlice';

// Helper function to extract error messages
const getErrorMessage = (error: any): string | null => {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Unknown error';
};

export const useDAOCommunities = (params: {
  limit?: number;
  tags?: string[];
  search?: string;
  enabled?: boolean;
} = {}) => {
  const { limit = 20, tags = [], search = '', enabled = true } = params;
  const dispatch = useAppDispatch();

  // Use RTK Query for data fetching
  const {
    data: queryDAOs,
    isLoading: queryLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useGetDAOsQuery({ limit, tags, search }, { skip: !enabled });

  // Redux implementation for fallback
  const reduxDAOs = useAppSelector(state => state.daoCommunities.ids.map(id => state.daoCommunities.entities[id]));
  const reduxLoading = useAppSelector(state => state.daoCommunities.loading);
  const reduxError = useAppSelector(state => state.daoCommunities.error);

  const fetchDAOsAction = useCallback(async (forceRefresh = false) => {
    return dispatch(fetchDAOs({ limit, tags, search, forceRefresh }));
  }, [dispatch, limit, tags, search]);

  return useMemo(() => ({
    daos: queryDAOs || reduxDAOs,
    loading: queryLoading || reduxLoading,
    error: getErrorMessage(queryError) || reduxError,
    refetch: queryRefetch || fetchDAOsAction,
    isReduxEnabled: true,
  }), [
    queryDAOs,
    reduxDAOs,
    queryLoading,
    reduxLoading,
    queryError,
    reduxError,
    queryRefetch,
    fetchDAOsAction,
  ]);
};

export const useMyDAOs = (pubkey: string, enabled = true) => {
  const dispatch = useAppDispatch();

  // Redux implementation
  const reduxMyDAOs = useAppSelector(selectMyDAOs);
  const reduxLoading = useAppSelector(state => state.daoCommunities.loadingMyDAOs);
  const reduxError = useAppSelector(state => state.daoCommunities.error);
  
  // RTK Query implementation
  const {
    data: queryDAOs,
    isLoading: queryLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useGetMyDAOsQuery({ pubkey }, { skip: !enabled || !pubkey });

  const fetchMyDAOsAction = useCallback(async (forceRefresh = false) => {
    if (pubkey) {
      return dispatch(fetchMyDAOs({ pubkey, forceRefresh }));
    }
    return Promise.resolve();
  }, [dispatch, pubkey]);

  return useMemo(() => ({
    daos: reduxMyDAOs.length > 0 ? reduxMyDAOs : (queryDAOs || []),
    loading: reduxLoading || queryLoading,
    error: reduxError || getErrorMessage(queryError),
    refetch: fetchMyDAOsAction,
    isReduxEnabled: true,
  }), [
    queryDAOs,
    reduxMyDAOs,
    queryLoading,
    reduxLoading,
    queryError,
    reduxError,
    queryRefetch,
    fetchMyDAOsAction,
  ]);
};

export const useTrendingDAOs = (limit = 20, enabled = true) => {
  const dispatch = useAppDispatch();

  // Redux implementation
  const reduxTrendingDAOs = useAppSelector(selectTrendingDAOs);
  const reduxLoading = useAppSelector(state => state.daoCommunities.loadingTrending);
  const reduxError = useAppSelector(state => state.daoCommunities.error);
  
  // RTK Query implementation
  const {
    data: queryDAOs,
    isLoading: queryLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useGetTrendingDAOsQuery({ limit }, { skip: !enabled });

  const fetchTrending = useCallback(async () => {
    return dispatch(fetchTrendingDAOs({ limit }));
  }, [dispatch, limit]);

  return useMemo(() => ({
    daos: queryDAOs || reduxTrendingDAOs,
    loading: queryLoading || reduxLoading,
    error: getErrorMessage(queryError) || reduxError,
    refetch: queryRefetch || fetchTrending,
    isReduxEnabled: true,
  }), [
    queryDAOs,
    reduxTrendingDAOs,
    queryLoading,
    reduxLoading,
    queryError,
    reduxError,
    queryRefetch,
    fetchTrending,
  ]);
};

export const useDAOById = (daoId: string, enabled = true) => {
  const dispatch = useAppDispatch();

  // Redux implementation
  const reduxDAO = useAppSelector(state => selectDAOById(state.daoCommunities, daoId));
  
  // RTK Query implementation
  const {
    data: queryDAO,
    isLoading: queryLoading,
    error: queryError,
    refetch: queryRefetch,
  } = useGetDAOByIdQuery(daoId, { skip: !enabled || !daoId });

  const fetchDAO = useCallback(async () => {
    if (daoId) {
      return dispatch(fetchDAOById(daoId));
    }
    return Promise.resolve();
  }, [dispatch, daoId]);

  // Auto-fetch DAO if not found in store
  useEffect(() => {
    if (enabled && daoId && !reduxDAO) {
      fetchDAO();
    }
  }, [enabled, daoId, reduxDAO, fetchDAO]);

  return useMemo(() => ({
    dao: reduxDAO || queryDAO,
    loading: queryLoading && !reduxDAO,
    error: getErrorMessage(queryError),
    refetch: fetchDAO,
    isReduxEnabled: true,
  }), [
    queryDAO,
    reduxDAO,
    queryLoading,
    queryError,
    queryRefetch,
    fetchDAO,
  ]);
};

export const useCreateDAO = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCommunity = useCallback(async (name: string, description: string, tags: string[] = [], avatar?: string, banner?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dispatch(createDAO({ name, description, tags, avatar, banner }));
      
      if (createDAO.fulfilled.match(result)) {
        return result.payload.id;
      } else {
        const errorMessage = result.payload as string || 'Failed to create DAO';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create DAO';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return useMemo(() => ({
    createDAO: createCommunity,
    loading,
    error,
    isReduxEnabled: true,
  }), [createCommunity, loading, error]);
};

export const useJoinDAO = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinCommunity = useCallback(async (daoId: string, userPubkey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dispatch(joinDAO({ daoId, userPubkey }));
      
      if (joinDAO.fulfilled.match(result)) {
        return true;
      } else {
        const errorMessage = result.payload as string || 'Failed to join DAO';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join DAO';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return useMemo(() => ({
    joinDAO: joinCommunity,
    loading,
    error,
    isReduxEnabled: true,
  }), [joinCommunity, loading, error]);
};

export const useLeaveDAO = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leaveCommunity = useCallback(async (daoId: string, userPubkey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dispatch(leaveDAO({ daoId, userPubkey }));
      
      if (leaveDAO.fulfilled.match(result)) {
        return true;
      } else {
        const errorMessage = result.payload as string || 'Failed to leave DAO';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave DAO';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  return useMemo(() => ({
    leaveDAO: leaveCommunity,
    loading,
    error,
    isReduxEnabled: true,
  }), [leaveCommunity, loading, error]);
};

// ===== DAO PROPOSALS HOOKS =====

export const useDAOProposals = (daoId: string, options: {
  status?: 'active' | 'passed' | 'rejected' | 'canceled';
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const { status, limit = 20, enabled = true } = options;

  const {
    data: proposals,
    isLoading: loading,
    error,
    refetch,
  } = useGetProposalsByDAOQuery({ 
    daoId, 
    status, 
    limit 
  }, { 
    skip: !enabled || !daoId
  });

  return useMemo(() => ({
    proposals: proposals || [],
    loading,
    error: getErrorMessage(error),
    refetch,
    isReduxEnabled: true,
  }), [
    proposals,
    loading,
    error,
    refetch,
  ]);
};

export const useDAOProposal = (proposalId: string, enabled = true) => {
  const {
    data: proposal,
    isLoading: loading,
    error,
    refetch,
  } = useGetProposalByIdQuery(proposalId, { skip: !enabled || !proposalId });

  return useMemo(() => ({
    proposal,
    loading,
    error: getErrorMessage(error),
    refetch,
    isReduxEnabled: true,
  }), [
    proposal,
    loading,
    error,
    refetch,
  ]);
};

export const useCreateProposal = () => {
  // Use only RTK Query for proposal creation
  const [createProposalMutation, { isLoading: loading, error }] = useCreateProposalMutation();

  const createProposal = useCallback(async (proposalData: {
    daoId: string;
    title: string;
    description: string;
    options: string[];
    duration?: number;
  }) => {
    return createProposalMutation(proposalData);
  }, [createProposalMutation]);

  return useMemo(() => ({
    createProposal,
    loading,
    error: getErrorMessage(error),
    isReduxEnabled: true,
  }), [createProposal, loading, error]);
};

export const useVoteOnProposal = () => {
  // Use only RTK Query for voting
  const [voteOnProposalMutation, { isLoading: loading, error }] = useVoteOnProposalMutation();

  const voteOnProposal = useCallback(async (proposalId: string, optionIndex: number, userPubkey: string) => {
    return voteOnProposalMutation({ proposalId, optionIndex, userPubkey });
  }, [voteOnProposalMutation]);

  return useMemo(() => ({
    voteOnProposal,
    loading,
    error: getErrorMessage(error),
    isReduxEnabled: true,
  }), [voteOnProposal, loading, error]);
};

// Simplified remaining hooks
export const useDAOSearch = () => {
  const dispatch = useAppDispatch();
  const searchResults = useAppSelector(selectSearchResults);
  const searchState = useAppSelector(state => state.daoCommunities.searchResults);

  const search = useCallback((query: string) => {
    // Implementation would go here
  }, [dispatch]);

  const clearSearchResults = useCallback(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  return useMemo(() => ({
    search,
    clearSearch: clearSearchResults,
    results: searchResults,
    query: searchState.query,
    loading: searchState.loading,
    isReduxEnabled: true,
  }), [
    search,
    clearSearchResults,
    searchResults,
    searchState.query,
    searchState.loading,
  ]);
};

export const useDAOMetrics = () => {
  const metrics = useAppSelector(selectDAOMetrics);

  return useMemo(() => ({
    metrics,
    isReduxEnabled: true,
  }), [metrics]);
};

export const useCurrentDAO = () => {
  const dispatch = useAppDispatch();
  const currentDAO = useAppSelector(selectCurrentDAO);

  const setCurrentDAOId = useCallback((daoId: string | null) => {
    dispatch(setCurrentDAO(daoId));
  }, [dispatch]);

  return useMemo(() => ({
    currentDAO,
    setCurrentDAO: setCurrentDAOId,
    isReduxEnabled: true,
  }), [currentDAO, setCurrentDAOId]);
}; 
