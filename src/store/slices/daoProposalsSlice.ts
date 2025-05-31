import { 
  createSlice, 
  createEntityAdapter, 
  createAsyncThunk,
  PayloadAction 
} from '@reduxjs/toolkit';
import { ReduxDAOProposal, DAOProposalsState } from '../types';

// Entity adapter for normalized proposal storage
const daoProposalsAdapter = createEntityAdapter<ReduxDAOProposal>({
  selectId: (proposal) => proposal.id,
  sortComparer: (a, b) => {
    // Sort by status (active first), then by creation date
    if (a.status !== b.status) {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
    }
    return b.createdAt - a.createdAt;
  },
});

// Async thunks for proposal operations
export const fetchProposalsByDAO = createAsyncThunk(
  'daoProposals/fetchProposalsByDAO',
  async (params: {
    daoId: string;
    limit?: number;
    forceRefresh?: boolean;
  }, { dispatch, getState }) => {
    const { daoId, limit = 20, forceRefresh = false } = params;
    
    try {
      // Import DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('@/lib/dao/dao-service');
      
      // Get real proposals from DAO service
      const proposals = await daoService.getDAOProposals(daoId);
      
      // Convert DAO proposals to Redux format
      const reduxProposals: ReduxDAOProposal[] = proposals.map(proposal => {
        // Convert votes object to array format for Redux
        const voteArray = proposal.options.map((_, index) => {
          return Object.values(proposal.votes || {}).filter((_, voteIndex) => voteIndex === index).reduce((sum, count) => sum + count, 0);
        });
        
        const totalVotes = Object.values(proposal.votes || {}).reduce((sum, count) => sum + count, 0);
        const timeRemaining = Math.max(0, proposal.endsAt - Math.floor(Date.now() / 1000));
        
        return {
          id: proposal.id,
          daoId: proposal.daoId,
          title: proposal.title,
          description: proposal.description,
          options: proposal.options,
          createdAt: proposal.createdAt,
          endsAt: proposal.endsAt,
          creator: proposal.creator,
          votes: voteArray,
          status: proposal.status,
          _meta: {
            cached_at: Date.now(),
            vote_count: totalVotes,
            user_voted: false, // Will be determined by component
            user_vote_option: null,
            time_remaining: timeRemaining,
            participation_rate: 0, // Will be calculated by component
            is_kick_proposal: proposal.title.toLowerCase().includes('kick') || proposal.title.toLowerCase().includes('ban'),
            target_member: undefined,
          },
        };
      });
      
      // Apply limit
      const limitedProposals = reduxProposals.slice(0, limit);
      
      return { proposals: limitedProposals, daoId, forceRefresh };
    } catch (error) {
      console.error('Error fetching proposals from DAO service:', error);
      throw error;
    }
  }
);

export const fetchProposalById = createAsyncThunk(
  'daoProposals/fetchProposalById',
  async (proposalId: string, { getState }) => {
    try {
      // Import DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('@/lib/dao/dao-service');
      
      // Get all proposals and find the specific one
      // Note: This is a temporary solution until we have a direct getProposalById method
      const state = getState() as any;
      const proposalsState = state.daoProposals;
      
      // First check if we already have it in state
      const existingProposal = proposalsState.entities[proposalId];
      if (existingProposal) {
        return existingProposal;
      }
      
      // If not found, we need to search through DAOs
      // This is not optimal but works for now
      console.log(`Fetching proposal ${proposalId} - searching through DAOs`);
      
      // For now, return null if not found in state
      // This will be improved when we add a direct getProposalById to DAO service
      return null;
    } catch (error) {
      console.error('Error fetching proposal by ID:', error);
      return null;
    }
  }
);

export const createProposal = createAsyncThunk(
  'daoProposals/createProposal',
  async (params: {
    daoId: string;
    title: string;
    description: string;
    options: string[];
    duration?: number; // in days
  }, { dispatch, rejectWithValue }) => {
    const { daoId, title, description, options, duration = 7 } = params;
    
    try {
      // Import DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('@/lib/dao/dao-service');
      const { nostrService } = await import('@/lib/nostr');
      
      // Create proposal using real DAO service
      const eventId = await daoService.createProposal(daoId, title, description, options, duration);
      
      if (!eventId) {
        throw new Error('Failed to create proposal - no event ID returned');
      }
      
      // Get current user pubkey
      const currentUserPubkey = nostrService.publicKey || 'unknown';
      
      // Return proposal in Redux format
      const now = Math.floor(Date.now() / 1000);
      const newProposal: ReduxDAOProposal = {
        id: eventId,
        daoId,
        title,
        description,
        options,
        createdAt: now,
        endsAt: now + (duration * 86400),
        creator: currentUserPubkey,
        votes: options.map(() => 0),
        status: 'active',
        _meta: {
          cached_at: Date.now(),
          vote_count: 0,
          user_voted: false,
          user_vote_option: null,
          time_remaining: duration * 86400,
          participation_rate: 0,
          is_kick_proposal: title.toLowerCase().includes('kick') || title.toLowerCase().includes('ban'),
          target_member: undefined,
        },
      };
      
      return newProposal;
    } catch (error) {
      console.error('Error creating proposal:', error);
      return rejectWithValue(`Failed to create proposal: ${error instanceof Error ? error.message : error}`);
    }
  }
);

export const voteOnProposal = createAsyncThunk(
  'daoProposals/voteOnProposal',
  async (params: {
    proposalId: string;
    optionIndex: number;
    userPubkey: string;
  }, { dispatch, rejectWithValue, getState }) => {
    const { proposalId, optionIndex, userPubkey } = params;
    
    try {
      // Import DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('@/lib/dao/dao-service');
      
      // Vote using real DAO service
      const eventId = await daoService.voteOnProposal(proposalId, optionIndex);
      
      if (!eventId) {
        throw new Error('Failed to vote on proposal - no event ID returned');
      }
      
      return { 
        proposalId, 
        optionIndex, 
        userPubkey, 
        votedAt: Date.now(),
        eventId,
        success: true 
      };
    } catch (error) {
      console.error('Error voting on proposal:', error);
      return rejectWithValue(`Failed to vote on proposal: ${error instanceof Error ? error.message : error}`);
    }
  }
);

export const createKickProposal = createAsyncThunk(
  'daoProposals/createKickProposal',
  async (params: {
    daoId: string;
    targetMember: string;
    reason: string;
  }, { dispatch, rejectWithValue }) => {
    const { daoId, targetMember, reason } = params;
    
    try {
      // This will be implemented with the actual DAO service
      const kickProposal: ReduxDAOProposal = {
        id: `kick_proposal_${Date.now()}`,
        daoId,
        title: `Kick Member: ${targetMember.slice(0, 8)}...`,
        description: `Proposal to remove member ${targetMember} from the community. Reason: ${reason}`,
        options: ['Kick Member', 'Keep Member', 'Abstain'],
        createdAt: Math.floor(Date.now() / 1000),
        endsAt: Math.floor(Date.now() / 1000) + (3 * 86400), // 3 days for kick proposals
        creator: 'current_user_pubkey',
        votes: { '0': 0, '1': 0, '2': 0 },
        status: 'active',
        _meta: {
          cached_at: Date.now(),
          vote_count: 0,
          user_voted: false,
          user_vote_option: undefined,
          is_kick_proposal: true,
          target_member: targetMember,
        },
      };
      
      return kickProposal;
    } catch (error) {
      return rejectWithValue(`Failed to create kick proposal: ${error}`);
    }
  }
);

// Initial state
const initialState: DAOProposalsState = daoProposalsAdapter.getInitialState({
  loading: false,
  loadingVotes: {},
  error: null,
  voteErrors: {},
  proposalsByDAO: {},
  userVotes: {},
  activeSubscriptions: {},
});

// Slice definition
const daoProposalsSlice = createSlice({
  name: 'daoProposals',
  initialState,
  reducers: {
    // Update proposal status (for real-time updates)
    updateProposalStatus: (state, action: PayloadAction<{
      proposalId: string;
      status: ReduxDAOProposal['status'];
    }>) => {
      const { proposalId, status } = action.payload;
      const proposal = state.entities[proposalId];
      if (proposal) {
        proposal.status = status;
        proposal._meta.cached_at = Date.now();
      }
    },
    
    // Update vote counts (for real-time updates)
    updateVoteCounts: (state, action: PayloadAction<{
      proposalId: string;
      votes: Record<string, number>;
    }>) => {
      const { proposalId, votes } = action.payload;
      const proposal = state.entities[proposalId];
      if (proposal) {
        proposal.votes = votes;
        proposal._meta.vote_count = Object.values(votes).reduce((sum, count) => sum + count, 0);
        proposal._meta.cached_at = Date.now();
      }
    },
    
    // Set user vote (for optimistic updates)
    setUserVote: (state, action: PayloadAction<{
      proposalId: string;
      optionIndex: number;
    }>) => {
      const { proposalId, optionIndex } = action.payload;
      const proposal = state.entities[proposalId];
      if (proposal) {
        proposal._meta.user_voted = true;
        proposal._meta.user_vote_option = optionIndex;
        proposal._meta.cached_at = Date.now();
        
        // Store user vote
        state.userVotes[proposalId] = {
          proposalId,
          optionIndex,
          votedAt: Date.now(),
        };
      }
    },
    
    // Clear vote error
    clearVoteError: (state, action: PayloadAction<string>) => {
      const proposalId = action.payload;
      delete state.voteErrors[proposalId];
      delete state.loadingVotes[proposalId];
    },
    
    // Subscribe to proposal updates
    subscribeToProposal: (state, action: PayloadAction<{
      proposalId: string;
      daoId: string;
      subscriptionId: string;
    }>) => {
      const { proposalId, daoId, subscriptionId } = action.payload;
      state.activeSubscriptions[proposalId] = {
        daoId,
        subscriptionId,
        lastUpdate: Date.now(),
      };
    },
    
    // Unsubscribe from proposal updates
    unsubscribeFromProposal: (state, action: PayloadAction<string>) => {
      const proposalId = action.payload;
      delete state.activeSubscriptions[proposalId];
    },
    
    // Reset proposals state
    resetProposals: (state) => {
      daoProposalsAdapter.removeAll(state);
      state.proposalsByDAO = {};
      state.userVotes = {};
      state.activeSubscriptions = {};
      state.loadingVotes = {};
      state.voteErrors = {};
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch Proposals by DAO
      .addCase(fetchProposalsByDAO.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProposalsByDAO.fulfilled, (state, action) => {
        state.loading = false;
        const { proposals, daoId } = action.payload;
        
        daoProposalsAdapter.upsertMany(state, proposals);
        
        // Update proposals by DAO mapping
        const proposalIds = proposals.map(p => p.id);
        const kickProposalIds = proposals.filter(p => p._meta.is_kick_proposal).map(p => p.id);
        
        state.proposalsByDAO[daoId] = {
          proposalIds,
          kickProposalIds,
          cachedAt: Date.now(),
        };
      })
      .addCase(fetchProposalsByDAO.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch proposals';
      })
      
      // Fetch Proposal by ID
      .addCase(fetchProposalById.fulfilled, (state, action) => {
        if (action.payload) {
          daoProposalsAdapter.upsertOne(state, action.payload);
        }
      })
      
      // Create Proposal
      .addCase(createProposal.fulfilled, (state, action) => {
        const newProposal = action.payload;
        daoProposalsAdapter.addOne(state, newProposal);
        
        // Update DAO proposals mapping
        const daoId = newProposal.daoId;
        if (!state.proposalsByDAO[daoId]) {
          state.proposalsByDAO[daoId] = {
            proposalIds: [],
            kickProposalIds: [],
            cachedAt: Date.now(),
          };
        }
        
        state.proposalsByDAO[daoId].proposalIds.unshift(newProposal.id);
        if (newProposal._meta.is_kick_proposal) {
          state.proposalsByDAO[daoId].kickProposalIds.unshift(newProposal.id);
        }
        state.proposalsByDAO[daoId].cachedAt = Date.now();
      })
      
      // Create Kick Proposal
      .addCase(createKickProposal.fulfilled, (state, action) => {
        const kickProposal = action.payload;
        daoProposalsAdapter.addOne(state, kickProposal);
        
        // Update DAO proposals mapping
        const daoId = kickProposal.daoId;
        if (!state.proposalsByDAO[daoId]) {
          state.proposalsByDAO[daoId] = {
            proposalIds: [],
            kickProposalIds: [],
            cachedAt: Date.now(),
          };
        }
        
        state.proposalsByDAO[daoId].proposalIds.unshift(kickProposal.id);
        state.proposalsByDAO[daoId].kickProposalIds.unshift(kickProposal.id);
        state.proposalsByDAO[daoId].cachedAt = Date.now();
      })
      
      // Vote on Proposal
      .addCase(voteOnProposal.pending, (state, action) => {
        const { proposalId } = action.meta.arg;
        state.loadingVotes[proposalId] = true;
        delete state.voteErrors[proposalId];
      })
      .addCase(voteOnProposal.fulfilled, (state, action) => {
        const { proposalId, optionIndex, userPubkey } = action.payload;
        const proposal = state.entities[proposalId];
        
        if (proposal) {
          // Update vote count optimistically
          proposal.votes[optionIndex] = (proposal.votes[optionIndex] || 0) + 1;
          proposal._meta.vote_count++;
          proposal._meta.user_voted = true;
          proposal._meta.user_vote_option = optionIndex;
          proposal._meta.cached_at = Date.now();
          
          // Store user vote
          state.userVotes[proposalId] = {
            proposalId,
            optionIndex,
            votedAt: Date.now(),
          };
        }
        
        delete state.loadingVotes[proposalId];
      })
      .addCase(voteOnProposal.rejected, (state, action) => {
        const { proposalId } = action.meta.arg;
        state.voteErrors[proposalId] = action.error.message || 'Failed to vote';
        delete state.loadingVotes[proposalId];
      });
  },
});

// Export actions
export const {
  updateProposalStatus,
  updateVoteCounts,
  setUserVote,
  clearVoteError,
  subscribeToProposal,
  unsubscribeFromProposal,
  resetProposals,
} = daoProposalsSlice.actions;

// Export entity selectors
export const {
  selectAll: selectAllProposals,
  selectById: selectProposalById,
  selectIds: selectProposalIds,
  selectEntities: selectProposalEntities,
  selectTotal: selectTotalProposals,
} = daoProposalsAdapter.getSelectors();

// Custom selectors
export const selectProposalsByDAO = (state: any, daoId: string) => {
  const proposalsState = state.daoProposals;
  const daoProposals = proposalsState.proposalsByDAO[daoId];
  
  if (!daoProposals) return [];
  
  return daoProposals.proposalIds
    .map((id: string) => proposalsState.entities[id])
    .filter(Boolean);
};

export const selectActiveProposals = (state: any) => {
  return selectAllProposals(state.daoProposals).filter((proposal: ReduxDAOProposal) => 
    proposal.status === 'active'
  );
};

export const selectKickProposalsByDAO = (state: any, daoId: string) => {
  const proposalsState = state.daoProposals;
  const daoProposals = proposalsState.proposalsByDAO[daoId];
  
  if (!daoProposals) return [];
  
  return daoProposals.kickProposalIds
    .map((id: string) => proposalsState.entities[id])
    .filter(Boolean);
};

export const selectUserVote = (state: any, proposalId: string) => {
  return state.daoProposals.userVotes[proposalId] || null;
};

export const selectVoteLoading = (state: any, proposalId: string) => {
  return state.daoProposals.loadingVotes[proposalId] || false;
};

export const selectVoteError = (state: any, proposalId: string) => {
  return state.daoProposals.voteErrors[proposalId] || null;
};

export const selectActiveSubscriptions = (state: any) => {
  return state.daoProposals.activeSubscriptions;
};

// Export reducer
export default daoProposalsSlice.reducer; 

