import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { TAG_TYPES } from '../types';
import type { 
  ReduxDAO, 
  ReduxDAOProposal, 
  ReduxCommunityPost, 
  ReduxPendingPost,
  ReduxModerationAction,
  ReduxMemberBan,
  ReduxContentReport 
} from '../types';

// Base query configuration for DAO API
const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    headers.set('Content-Type', 'application/json');
    
    // Add authentication if available
    const state = getState() as any;
    const authToken = state.auth?.token;
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    
    return headers;
  },
});

// DAO API with RTK Query
export const daoApi = createApi({
  reducerPath: 'daoApi',
  baseQuery,
  tagTypes: [
    TAG_TYPES.DAO,
    TAG_TYPES.DAO_PROPOSAL,
    TAG_TYPES.DAO_COMMUNITY_POST,
    TAG_TYPES.DAO_PENDING_POST,
    TAG_TYPES.DAO_MEMBER,
    TAG_TYPES.DAO_MODERATION,
    TAG_TYPES.DAO_BAN,
    TAG_TYPES.DAO_REPORT,
  ],
  endpoints: (builder) => ({
    
    // ===== DAO COMMUNITIES =====
    
    // Get all DAOs with pagination and filtering
    getDAOs: builder.query<{
      daos: ReduxDAO[];
      total: number;
      hasMore: boolean;
    }, {
      limit?: number;
      offset?: number;
      tags?: string[];
      search?: string;
    }>({
      query: ({ limit = 20, offset = 0, tags, search }) => ({
        url: '/dao/communities',
        params: { limit, offset, tags: tags?.join(','), search },
      }),
      providesTags: (result) => [
        TAG_TYPES.DAO,
        ...(result?.daos.map(dao => ({ type: TAG_TYPES.DAO as const, id: dao.id })) || []),
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    // Get user's DAOs
    getMyDAOs: builder.query<ReduxDAO[], { pubkey: string }>({
      query: ({ pubkey }) => ({
        url: `/dao/communities/user/${pubkey}`,
      }),
      providesTags: (result) => [
        TAG_TYPES.DAO,
        ...(result?.map(dao => ({ type: TAG_TYPES.DAO as const, id: dao.id })) || []),
      ],
      keepUnusedDataFor: 600, // 10 minutes
    }),
    
    // Get trending DAOs
    getTrendingDAOs: builder.query<ReduxDAO[], { limit?: number }>({
      query: ({ limit = 20 }) => ({
        url: '/dao/communities/trending',
        params: { limit },
      }),
      providesTags: (result) => [
        TAG_TYPES.DAO,
        ...(result?.map(dao => ({ type: TAG_TYPES.DAO as const, id: dao.id })) || []),
      ],
      keepUnusedDataFor: 180, // 3 minutes (trending changes frequently)
    }),
    
    // Get DAO by ID
    getDAOById: builder.query<ReduxDAO, string>({
      query: (daoId) => ({
        url: `/dao/communities/${daoId}`,
      }),
      providesTags: (result, error, daoId) => [
        { type: TAG_TYPES.DAO, id: daoId },
      ],
      keepUnusedDataFor: 600, // 10 minutes
    }),
    
    // Create new DAO
    createDAO: builder.mutation<ReduxDAO, {
      name: string;
      description: string;
      tags?: string[];
      isPrivate?: boolean;
      guidelines?: string;
    }>({
      query: (daoData) => ({
        url: '/dao/communities',
        method: 'POST',
        body: daoData,
      }),
      invalidatesTags: [TAG_TYPES.DAO],
      // Optimistic update
      async onQueryStarted(daoData, { dispatch, queryFulfilled }) {
        try {
          const { data: newDAO } = await queryFulfilled;
          
          // Update user's DAOs cache
          dispatch(
            daoApi.util.updateQueryData('getMyDAOs', { pubkey: 'current_user_pubkey' }, (draft) => {
              draft.unshift(newDAO);
            })
          );
        } catch {}
      },
    }),
    
    // Join DAO
    joinDAO: builder.mutation<{ success: boolean }, {
      daoId: string;
      userPubkey: string;
    }>({
      query: ({ daoId, userPubkey }) => ({
        url: `/dao/communities/${daoId}/join`,
        method: 'POST',
        body: { userPubkey },
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO, id: daoId },
        TAG_TYPES.DAO_MEMBER,
      ],
      // Optimistic update
      async onQueryStarted({ daoId, userPubkey }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          daoApi.util.updateQueryData('getDAOById', daoId, (draft) => {
            if (draft && !draft.members.includes(userPubkey)) {
              draft.members.push(userPubkey);
              draft._meta.member_count++;
              draft._meta.user_is_member = true;
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    
    // Leave DAO
    leaveDAO: builder.mutation<{ success: boolean }, {
      daoId: string;
      userPubkey: string;
    }>({
      query: ({ daoId, userPubkey }) => ({
        url: `/dao/communities/${daoId}/leave`,
        method: 'POST',
        body: { userPubkey },
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO, id: daoId },
        TAG_TYPES.DAO_MEMBER,
      ],
      // Optimistic update
      async onQueryStarted({ daoId, userPubkey }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          daoApi.util.updateQueryData('getDAOById', daoId, (draft) => {
            if (draft) {
              draft.members = draft.members.filter(member => member !== userPubkey);
              draft._meta.member_count = Math.max(0, draft._meta.member_count - 1);
              draft._meta.user_is_member = false;
              draft._meta.user_is_moderator = false;
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    
    // ===== DAO PROPOSALS =====
    
    // Get proposals for a DAO
    getProposalsByDAO: builder.query<ReduxDAOProposal[], {
      daoId: string;
      status?: 'active' | 'passed' | 'rejected' | 'canceled';
      limit?: number;
    }>({
      queryFn: async ({ daoId, status, limit = 20 }) => {
        try {
          // Import DAO service dynamically to avoid circular dependencies
          const { daoService } = await import('@/lib/dao/dao-service');
          
          const proposals = await daoService.getDAOProposals(daoId);
          
          // Convert DAO proposals to Redux format
          const reduxProposals: ReduxDAOProposal[] = proposals.map(proposal => ({
            id: proposal.id,
            daoId: proposal.daoId,
            title: proposal.title,
            description: proposal.description,
            options: proposal.options,
            createdAt: proposal.createdAt,
            endsAt: proposal.endsAt,
            creator: proposal.creator,
            votes: Object.values(proposal.votes || {}),
            status: proposal.status,
            _meta: {
              vote_count: Object.values(proposal.votes || {}).reduce((sum, count) => sum + count, 0),
              user_voted: false, // Will be determined by component
              user_vote_option: null,
              time_remaining: Math.max(0, proposal.endsAt - Math.floor(Date.now() / 1000)),
              participation_rate: 0 // Will be calculated by component
            }
          }));
          
          // Filter by status if specified
          const filteredProposals = status 
            ? reduxProposals.filter(p => p.status === status)
            : reduxProposals;
          
          // Apply limit
          const limitedProposals = filteredProposals.slice(0, limit);
          
          return { data: limitedProposals };
        } catch (error) {
          console.error('Error fetching proposals:', error);
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Failed to fetch proposals' 
            } 
          };
        }
      },
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_PROPOSAL, id: `DAO_${daoId}` },
        ...(result?.map(proposal => ({ type: TAG_TYPES.DAO_PROPOSAL as const, id: proposal.id })) || []),
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    // Get proposal by ID
    getProposalById: builder.query<ReduxDAOProposal, string>({
      query: (proposalId) => ({
        url: `/dao/proposals/${proposalId}`,
      }),
      providesTags: (result, error, proposalId) => [
        { type: TAG_TYPES.DAO_PROPOSAL, id: proposalId },
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    // Create proposal
    createProposal: builder.mutation<ReduxDAOProposal, {
      daoId: string;
      title: string;
      description: string;
      options: string[];
      duration?: number;
    }>({
      queryFn: async (proposalData) => {
        try {
          // Import DAO service dynamically to avoid circular dependencies
          const { daoService } = await import('@/lib/dao/dao-service');
          
          const eventId = await daoService.createProposal(
            proposalData.daoId,
            proposalData.title,
            proposalData.description,
            proposalData.options,
            proposalData.duration || 7
          );
          
          if (!eventId) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Failed to create proposal' } };
          }
          
          // Return a mock proposal object for Redux state
          const now = Math.floor(Date.now() / 1000);
          const proposal: ReduxDAOProposal = {
            id: eventId,
            daoId: proposalData.daoId,
            title: proposalData.title,
            description: proposalData.description,
            options: proposalData.options,
            createdAt: now,
            endsAt: now + ((proposalData.duration || 7) * 24 * 60 * 60),
            creator: '', // Will be filled by the service
            votes: proposalData.options.map(() => 0),
            status: 'active',
            _meta: {
              vote_count: 0,
              user_voted: false,
              user_vote_option: null,
              time_remaining: (proposalData.duration || 7) * 24 * 60 * 60,
              participation_rate: 0
            }
          };
          
          return { data: proposal };
        } catch (error) {
          console.error('Error creating proposal:', error);
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Failed to create proposal' 
            } 
          };
        }
      },
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_PROPOSAL, id: `DAO_${daoId}` },
        { type: TAG_TYPES.DAO, id: daoId },
      ],
    }),
    
    // Vote on proposal
    voteOnProposal: builder.mutation<{ success: boolean }, {
      proposalId: string;
      optionIndex: number;
      userPubkey: string;
    }>({
      queryFn: async ({ proposalId, optionIndex, userPubkey }) => {
        try {
          // Import DAO service dynamically to avoid circular dependencies
          const { daoService } = await import('@/lib/dao/dao-service');
          
          const eventId = await daoService.voteOnProposal(proposalId, optionIndex);
          
          if (!eventId) {
            return { error: { status: 'CUSTOM_ERROR', error: 'Failed to vote on proposal' } };
          }
          
          return { data: { success: true } };
        } catch (error) {
          console.error('Error voting on proposal:', error);
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              error: error instanceof Error ? error.message : 'Failed to vote on proposal' 
            } 
          };
        }
      },
      invalidatesTags: (result, error, { proposalId }) => [
        { type: TAG_TYPES.DAO_PROPOSAL, id: proposalId },
      ],
      // Optimistic update
      async onQueryStarted({ proposalId, optionIndex }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          daoApi.util.updateQueryData('getProposalById', proposalId, (draft) => {
            if (draft) {
              draft.votes[optionIndex] = (draft.votes[optionIndex] || 0) + 1;
              draft._meta.vote_count++;
              draft._meta.user_voted = true;
              draft._meta.user_vote_option = optionIndex;
            }
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    
    // Create kick proposal
    createKickProposal: builder.mutation<ReduxDAOProposal, {
      daoId: string;
      targetMember: string;
      reason: string;
    }>({
      query: (kickData) => ({
        url: '/dao/proposals/kick',
        method: 'POST',
        body: kickData,
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_PROPOSAL, id: `DAO_${daoId}` },
        { type: TAG_TYPES.DAO, id: daoId },
      ],
    }),
    
    // ===== COMMUNITY POSTS =====
    
    // Get approved posts for a DAO
    getApprovedPosts: builder.query<ReduxCommunityPost[], {
      daoId: string;
      limit?: number;
      offset?: number;
    }>({
      query: ({ daoId, limit = 20, offset = 0 }) => ({
        url: `/dao/communities/${daoId}/posts`,
        params: { limit, offset, status: 'approved' },
      }),
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_COMMUNITY_POST, id: `DAO_${daoId}` },
        ...(result?.map(post => ({ type: TAG_TYPES.DAO_COMMUNITY_POST as const, id: post.id })) || []),
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    // Get pending posts for moderation
    getPendingPosts: builder.query<ReduxPendingPost[], {
      daoId: string;
      limit?: number;
    }>({
      query: ({ daoId, limit = 20 }) => ({
        url: `/dao/communities/${daoId}/posts/pending`,
        params: { limit },
      }),
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_PENDING_POST, id: `DAO_${daoId}` },
        ...(result?.map(post => ({ type: TAG_TYPES.DAO_PENDING_POST as const, id: post.id })) || []),
      ],
      keepUnusedDataFor: 60, // 1 minute (moderation queue changes frequently)
    }),
    
    // Submit post to community
    submitPost: builder.mutation<ReduxPendingPost, {
      daoId: string;
      content: string;
      title?: string;
      author: string;
    }>({
      query: (postData) => ({
        url: '/dao/posts',
        method: 'POST',
        body: postData,
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_PENDING_POST, id: `DAO_${daoId}` },
      ],
    }),
    
    // Approve post (moderator action)
    approvePost: builder.mutation<ReduxCommunityPost, {
      postId: string;
      moderatorPubkey: string;
    }>({
      query: ({ postId, moderatorPubkey }) => ({
        url: `/dao/posts/${postId}/approve`,
        method: 'POST',
        body: { moderatorPubkey },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: TAG_TYPES.DAO_PENDING_POST, id: postId },
        { type: TAG_TYPES.DAO_COMMUNITY_POST, id: postId },
        TAG_TYPES.DAO_MODERATION,
      ],
    }),
    
    // Reject post (moderator action)
    rejectPost: builder.mutation<{ success: boolean }, {
      postId: string;
      moderatorPubkey: string;
      reason?: string;
    }>({
      query: ({ postId, moderatorPubkey, reason }) => ({
        url: `/dao/posts/${postId}/reject`,
        method: 'POST',
        body: { moderatorPubkey, reason },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: TAG_TYPES.DAO_PENDING_POST, id: postId },
        TAG_TYPES.DAO_MODERATION,
      ],
    }),
    
    // ===== MODERATION =====
    
    // Get banned members
    getBannedMembers: builder.query<ReduxMemberBan[], {
      daoId: string;
      activeOnly?: boolean;
    }>({
      query: ({ daoId, activeOnly = true }) => ({
        url: `/dao/communities/${daoId}/bans`,
        params: { activeOnly },
      }),
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_BAN, id: `DAO_${daoId}` },
        ...(result?.map(ban => ({ type: TAG_TYPES.DAO_BAN as const, id: ban.id })) || []),
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
    // Ban member
    banMember: builder.mutation<ReduxMemberBan, {
      daoId: string;
      targetUser: string;
      moderator: string;
      reason: string;
      duration?: number; // in hours, undefined for permanent
    }>({
      query: (banData) => ({
        url: '/dao/moderation/ban',
        method: 'POST',
        body: banData,
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_BAN, id: `DAO_${daoId}` },
        { type: TAG_TYPES.DAO, id: daoId },
        TAG_TYPES.DAO_MODERATION,
      ],
    }),
    
    // Unban member
    unbanMember: builder.mutation<{ success: boolean }, {
      banId: string;
      moderator: string;
    }>({
      query: ({ banId, moderator }) => ({
        url: `/dao/moderation/unban/${banId}`,
        method: 'POST',
        body: { moderator },
      }),
      invalidatesTags: (result, error, { banId }) => [
        { type: TAG_TYPES.DAO_BAN, id: banId },
        TAG_TYPES.DAO_MODERATION,
      ],
    }),
    
    // Get content reports
    getContentReports: builder.query<ReduxContentReport[], {
      daoId: string;
      status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
      limit?: number;
    }>({
      query: ({ daoId, status, limit = 20 }) => ({
        url: `/dao/communities/${daoId}/reports`,
        params: { status, limit },
      }),
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_REPORT, id: `DAO_${daoId}` },
        ...(result?.map(report => ({ type: TAG_TYPES.DAO_REPORT as const, id: report.id })) || []),
      ],
      keepUnusedDataFor: 180, // 3 minutes
    }),
    
    // Submit content report
    reportContent: builder.mutation<ReduxContentReport, {
      daoId: string;
      targetId: string;
      targetType: 'post' | 'comment' | 'user';
      category: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
      reason: string;
      reporter: string;
    }>({
      query: (reportData) => ({
        url: '/dao/moderation/report',
        method: 'POST',
        body: reportData,
      }),
      invalidatesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_REPORT, id: `DAO_${daoId}` },
      ],
    }),
    
    // Resolve content report
    resolveReport: builder.mutation<{ success: boolean }, {
      reportId: string;
      moderator: string;
      resolution: string;
      action?: 'dismiss' | 'warn' | 'ban' | 'delete';
    }>({
      query: ({ reportId, moderator, resolution, action }) => ({
        url: `/dao/moderation/reports/${reportId}/resolve`,
        method: 'POST',
        body: { moderator, resolution, action },
      }),
      invalidatesTags: (result, error, { reportId }) => [
        { type: TAG_TYPES.DAO_REPORT, id: reportId },
        TAG_TYPES.DAO_MODERATION,
      ],
    }),
    
    // Get moderation logs
    getModerationLogs: builder.query<ReduxModerationAction[], {
      daoId: string;
      limit?: number;
      moderator?: string;
    }>({
      query: ({ daoId, limit = 50, moderator }) => ({
        url: `/dao/communities/${daoId}/moderation/logs`,
        params: { limit, moderator },
      }),
      providesTags: (result, error, { daoId }) => [
        { type: TAG_TYPES.DAO_MODERATION, id: `DAO_${daoId}` },
        ...(result?.map(action => ({ type: TAG_TYPES.DAO_MODERATION as const, id: action.id })) || []),
      ],
      keepUnusedDataFor: 300, // 5 minutes
    }),
    
  }),
});

// Export hooks for use in components
export const {
  // DAO Communities
  useGetDAOsQuery,
  useGetMyDAOsQuery,
  useGetTrendingDAOsQuery,
  useGetDAOByIdQuery,
  useCreateDAOMutation,
  useJoinDAOMutation,
  useLeaveDAOMutation,
  
  // DAO Proposals
  useGetProposalsByDAOQuery,
  useGetProposalByIdQuery,
  useCreateProposalMutation,
  useVoteOnProposalMutation,
  useCreateKickProposalMutation,
  
  // Community Posts
  useGetApprovedPostsQuery,
  useGetPendingPostsQuery,
  useSubmitPostMutation,
  useApprovePostMutation,
  useRejectPostMutation,
  
  // Moderation
  useGetBannedMembersQuery,
  useBanMemberMutation,
  useUnbanMemberMutation,
  useGetContentReportsQuery,
  useReportContentMutation,
  useResolveReportMutation,
  useGetModerationLogsQuery,
} = daoApi;

export default daoApi; 

