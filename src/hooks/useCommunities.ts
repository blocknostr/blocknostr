// Community-focused hooks (abstraction layer over DAO hooks)
// Provides clean, universal interface while maintaining backward compatibility

import { useCallback, useMemo } from 'react';
import { communityAdapter } from '@/lib/adapters/communityAdapter';
import type { 
  Community, 
  CommunityProposal, 
  CommunitySearchFilters,
  CommunityMetrics 
} from '@/api/types/community';

// Import existing DAO hooks for underlying functionality
import {
  useDAOCommunities,
  useMyDAOs,
  useTrendingDAOs,
  useDAOById,
  useCreateDAO,
  useJoinDAO,
  useLeaveDAO,
  useDAOProposals,
  useDAOProposal,
  useCreateProposal,
  useVoteOnProposal,
  useDAOSearch,
  useCurrentDAO,
} from './useDAORedux';

// ===== COMMUNITY HOOKS =====

export const useCommunities = (params: {
  limit?: number;
  tags?: string[];
  search?: string;
  enabled?: boolean;
} = {}) => {
  const daoResult = useDAOCommunities(params);

  return useMemo(() => ({
    communities: daoResult.daos.map(communityAdapter.fromReduxDAO),
    loading: daoResult.loading,
    error: daoResult.error,
    total: daoResult.total,
    hasMore: daoResult.hasMore,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useMyCommunities = (pubkey: string, enabled = true) => {
  const daoResult = useMyDAOs(pubkey, enabled);

  return useMemo(() => ({
    communities: daoResult.daos.map(communityAdapter.fromReduxDAO),
    loading: daoResult.loading,
    error: daoResult.error,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useTrendingCommunities = (limit = 20, enabled = true) => {
  const daoResult = useTrendingDAOs(limit, enabled);

  return useMemo(() => ({
    communities: daoResult.daos.map(communityAdapter.fromReduxDAO),
    loading: daoResult.loading,
    error: daoResult.error,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useCommunityById = (communityId: string, enabled = true) => {
  const daoResult = useDAOById(communityId, enabled);

  return useMemo(() => ({
    community: daoResult.dao ? communityAdapter.fromReduxDAO(daoResult.dao) : null,
    loading: daoResult.loading,
    error: daoResult.error,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useCreateCommunity = () => {
  const daoResult = useCreateDAO();

  const createCommunity = useCallback(async (
    name: string, 
    description: string, 
    tags: string[] = []
  ) => {
    // Use the existing DAO creation logic
    return daoResult.createDAO(name, description, tags);
  }, [daoResult.createDAO]);

  return useMemo(() => ({
    createCommunity,
    loading: daoResult.loading,
    error: daoResult.error,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [createCommunity, daoResult.loading, daoResult.error, daoResult.isReduxEnabled]);
};

export const useJoinCommunity = () => {
  const daoResult = useJoinDAO();

  const joinCommunity = useCallback(async (
    communityId: string, 
    userPubkey: string
  ) => {
    // Use the existing DAO join logic
    return daoResult.joinDAO(communityId, userPubkey);
  }, [daoResult.joinDAO]);

  return useMemo(() => ({
    joinCommunity,
    loading: daoResult.loading,
    error: daoResult.error,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [joinCommunity, daoResult.loading, daoResult.error, daoResult.isReduxEnabled]);
};

export const useLeaveCommunity = () => {
  const daoResult = useLeaveDAO();

  const leaveCommunity = useCallback(async (
    communityId: string, 
    userPubkey: string
  ) => {
    // Use the existing DAO leave logic
    return daoResult.leaveDAO(communityId, userPubkey);
  }, [daoResult.leaveDAO]);

  return useMemo(() => ({
    leaveCommunity,
    loading: daoResult.loading,
    error: daoResult.error,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [leaveCommunity, daoResult.loading, daoResult.error, daoResult.isReduxEnabled]);
};

// ===== COMMUNITY PROPOSAL HOOKS =====

export const useCommunityProposals = (communityId: string, options: {
  status?: 'active' | 'passed' | 'rejected' | 'canceled';
  limit?: number;
  enabled?: boolean;
} = {}) => {
  const daoResult = useDAOProposals(communityId, options);

  return useMemo(() => ({
    proposals: daoResult.proposals.map(communityAdapter.fromReduxDAOProposal),
    loading: daoResult.loading,
    error: daoResult.error,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useCommunityProposal = (proposalId: string, enabled = true) => {
  const daoResult = useDAOProposal(proposalId, enabled);

  return useMemo(() => ({
    proposal: daoResult.proposal ? communityAdapter.fromReduxDAOProposal(daoResult.proposal) : null,
    loading: daoResult.loading,
    error: daoResult.error,
    refetch: daoResult.refetch,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult]);
};

export const useCreateCommunityProposal = () => {
  const daoResult = useCreateProposal();

  const createProposal = useCallback(async (proposalData: {
    communityId: string;
    title: string;
    description: string;
    options: string[];
    duration?: number;
  }) => {
    // Convert community proposal data to DAO format
    const daoProposalData = {
      daoId: proposalData.communityId,
      title: proposalData.title,
      description: proposalData.description,
      options: proposalData.options,
      duration: proposalData.duration,
    };
    
    return daoResult.createProposal(daoProposalData);
  }, [daoResult.createProposal]);

  return useMemo(() => ({
    createProposal,
    loading: daoResult.loading,
    error: daoResult.error,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [createProposal, daoResult.loading, daoResult.error, daoResult.isReduxEnabled]);
};

export const useVoteOnCommunityProposal = () => {
  const daoResult = useVoteOnProposal();

  const voteOnProposal = useCallback(async (
    proposalId: string, 
    optionIndex: number, 
    userPubkey: string
  ) => {
    // Use the existing DAO voting logic
    return daoResult.voteOnProposal(proposalId, optionIndex, userPubkey);
  }, [daoResult.voteOnProposal]);

  return useMemo(() => ({
    voteOnProposal,
    loading: daoResult.loading,
    error: daoResult.error,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [voteOnProposal, daoResult.loading, daoResult.error, daoResult.isReduxEnabled]);
};

// ===== UTILITY HOOKS =====

export const useCommunitySearch = () => {
  const daoResult = useDAOSearch();

  const searchCommunities = useCallback((filters: CommunitySearchFilters) => {
    // Convert community search filters to DAO format if needed
    const daoFilters = {
      query: filters.query,
      categories: filters.categories,
      tags: filters.tags,
      // Add other filter conversions as needed
    };
    
    return daoResult.searchCommunities(daoFilters);
  }, [daoResult.searchCommunities]);

  return useMemo(() => ({
    search: daoResult.search,
    clearSearch: daoResult.clearSearch,
    results: daoResult.results.map(communityAdapter.fromReduxDAO),
    query: daoResult.query,
    loading: daoResult.loading,
    searchCommunities,
    quickSearch: daoResult.quickSearch,
    searchByCategory: daoResult.searchByCategory,
    searchByTag: daoResult.searchByTag,
    isReduxEnabled: daoResult.isReduxEnabled,
    
    // Discovery data with community terminology
    trendingCommunities: daoResult.trendingCommunities,
    recommendedCommunities: daoResult.recommendedCommunities,
    popularTags: daoResult.popularTags,
    categories: daoResult.categories,
    searchFilters: daoResult.searchFilters,
    searchLoading: daoResult.searchLoading,
    trendingLoading: daoResult.trendingLoading,
    recommendationsLoading: daoResult.recommendationsLoading,
    tagsLoading: daoResult.tagsLoading,
    currentUserPubkey: daoResult.currentUserPubkey,
    hasUser: daoResult.hasUser,
    fetchTrendingCommunities: daoResult.fetchTrendingCommunities,
    fetchRecommendedCommunities: daoResult.fetchRecommendedCommunities,
    getDiscoveryStats: daoResult.getDiscoveryStats,
  }), [daoResult, searchCommunities]);
};

export const useCurrentCommunity = () => {
  const daoResult = useCurrentDAO();

  const setCurrentCommunity = useCallback((communityId: string | null) => {
    return daoResult.setCurrentDAO(communityId);
  }, [daoResult.setCurrentDAO]);

  return useMemo(() => ({
    currentCommunity: daoResult.currentDAO ? communityAdapter.fromReduxDAO(daoResult.currentDAO) : null,
    setCurrentCommunity,
    isReduxEnabled: daoResult.isReduxEnabled,
  }), [daoResult.currentDAO, setCurrentCommunity, daoResult.isReduxEnabled]);
};

// ===== CONVENIENCE HOOKS =====

// Hook for community metrics (placeholder for future implementation)
export const useCommunityMetrics = (communityId: string): {
  metrics: CommunityMetrics | null;
  loading: boolean;
  error: string | null;
} => {
  // This would be implemented when we have actual metrics
  return useMemo(() => ({
    metrics: null,
    loading: false,
    error: null,
  }), []);
};

// Hook for community member management
export const useCommunityMembers = (communityId: string) => {
  const { community } = useCommunityById(communityId);

  return useMemo(() => ({
    members: community?.members || [],
    moderators: community?.moderators || [],
    memberCount: community?.members.length || 0,
    isLoading: false, // Would be implemented with actual member fetching
  }), [community]);
};

// Hook for checking user's role in community
export const useCommunityRole = (communityId: string, userPubkey: string) => {
  const { community } = useCommunityById(communityId);

  return useMemo(() => {
    if (!community || !userPubkey) {
      return { role: null, isMember: false, isModerator: false, isCreator: false };
    }

    const isCreator = community.creator === userPubkey;
    const isModerator = community.moderators.includes(userPubkey);
    const isMember = community.members.includes(userPubkey);

    let role: 'creator' | 'moderator' | 'member' | null = null;
    if (isCreator) role = 'creator';
    else if (isModerator) role = 'moderator';
    else if (isMember) role = 'member';

    return { role, isMember, isModerator, isCreator };
  }, [community, userPubkey]);
}; 
