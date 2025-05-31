import { 
  createSlice, 
  createEntityAdapter, 
  createAsyncThunk,
  PayloadAction 
} from '@reduxjs/toolkit';
import { ReduxDAO, DAOCommunitiesState } from '../types';

// Entity adapter for normalized DAO storage
const daoCommunitiesAdapter = createEntityAdapter<ReduxDAO>({
  selectId: (dao) => dao.id,
  sortComparer: (a, b) => {
    // Sort by trending score first, then by member count, then by creation date
    if (a._meta.trending_score !== b._meta.trending_score) {
      return (b._meta.trending_score || 0) - (a._meta.trending_score || 0);
    }
    if (a._meta.member_count !== b._meta.member_count) {
      return b._meta.member_count - a._meta.member_count;
    }
    return b.createdAt - a.createdAt;
  },
});

// Async thunks for DAO operations
export const fetchDAOs = createAsyncThunk(
  'daoCommunities/fetchDAOs',
  async (params: {
    limit?: number;
    forceRefresh?: boolean;
  } = {}, { dispatch, getState }) => {
    const { limit = 20, forceRefresh = false } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Fetching DAOs from Nostr network:', { limit, forceRefresh });
      
      // Use the actual DAO service to fetch from Nostr
      const daos = await daoService.getDAOs(limit);
      
      console.log('[Redux] Fetched DAOs from Nostr:', daos.length);
      
      // Convert DAO objects to ReduxDAO format
      const reduxDAOs: ReduxDAO[] = daos.map(dao => ({
        id: dao.id,
        name: dao.name,
        description: dao.description,
        image: dao.image || '',
        avatar: dao.avatar || '',
        banner: dao.banner || '',
        creator: dao.creator,
        createdAt: dao.createdAt,
        members: dao.members,
        moderators: dao.moderators || [],
        bannedMembers: dao.bannedMembers || [],
        guidelines: dao.guidelines || '',
        isPrivate: dao.isPrivate || false,
        treasury: dao.treasury || { balance: 0, tokenSymbol: 'ALPH' },
        proposals: dao.proposals || 0,
        activeProposals: dao.activeProposals || 0,
        tags: dao.tags || [],
        _meta: {
          cached_at: Date.now(),
          member_count: dao.members.length,
          user_is_member: false, // Will be updated by other actions
          user_is_moderator: false,
          user_is_creator: false,
          last_activity: Date.now(),
          trending_score: 0,
        },
      }));
      
      return { daos: reduxDAOs, forceRefresh };
    } catch (error) {
      console.error('[Redux] Error fetching DAOs:', error);
      // Return empty array instead of mock data on error
      return { daos: [], forceRefresh };
    }
  }
);

export const fetchMyDAOs = createAsyncThunk(
  'daoCommunities/fetchMyDAOs',
  async (params: {
    pubkey: string;
    limit?: number;
    forceRefresh?: boolean;
  }, { dispatch }) => {
    const { pubkey, limit = 20, forceRefresh = false } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Fetching user DAOs from Nostr network:', { pubkey, limit, forceRefresh });
      
      // Use the actual DAO service to fetch user's DAOs from Nostr
      const daos = await daoService.getUserDAOs(pubkey, limit, forceRefresh);
      
      console.log('[Redux] Fetched user DAOs from Nostr:', daos.length);
      
      // Convert DAO objects to ReduxDAO format
      const reduxDAOs: ReduxDAO[] = daos.map(dao => ({
        id: dao.id,
        name: dao.name,
        description: dao.description,
        image: dao.image || '',
        avatar: dao.avatar || '',
        banner: dao.banner || '',
        creator: dao.creator,
        createdAt: dao.createdAt,
        members: dao.members,
        moderators: dao.moderators || [],
        bannedMembers: dao.bannedMembers || [],
        guidelines: dao.guidelines || '',
        isPrivate: dao.isPrivate || false,
        treasury: dao.treasury || { balance: 0, tokenSymbol: 'ALPH' },
        proposals: dao.proposals || 0,
        activeProposals: dao.activeProposals || 0,
        tags: dao.tags || [],
        _meta: {
          cached_at: Date.now(),
          member_count: dao.members.length,
          user_is_member: dao.members.includes(pubkey),
          user_is_moderator: dao.moderators?.includes(pubkey) || false,
          user_is_creator: dao.creator === pubkey,
          last_activity: Date.now(),
          trending_score: 0,
        },
      }));
      
      return { daos: reduxDAOs, pubkey, forceRefresh };
    } catch (error) {
      console.error('[Redux] Error fetching user DAOs:', error);
      // Return empty array instead of mock data on error
      return { daos: [], pubkey, forceRefresh };
    }
  }
);

export const fetchTrendingDAOs = createAsyncThunk(
  'daoCommunities/fetchTrendingDAOs',
  async (params: {
    limit?: number;
  } = {}, { dispatch }) => {
    const { limit = 20 } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Fetching trending DAOs from Nostr network:', { limit });
      
      // Use the actual DAO service to fetch trending DAOs from Nostr
      const daos = await daoService.getTrendingDAOs(limit);
      
      console.log('[Redux] Fetched trending DAOs from Nostr:', daos.length);
      
      // Convert DAO objects to ReduxDAO format
      const reduxDAOs: ReduxDAO[] = daos.map(dao => ({
        id: dao.id,
        name: dao.name,
        description: dao.description,
        image: dao.image || '',
        avatar: dao.avatar || '',
        banner: dao.banner || '',
        creator: dao.creator,
        createdAt: dao.createdAt,
        members: dao.members,
        moderators: dao.moderators || [],
        bannedMembers: dao.bannedMembers || [],
        guidelines: dao.guidelines || '',
        isPrivate: dao.isPrivate || false,
        treasury: dao.treasury || { balance: 0, tokenSymbol: 'ALPH' },
        proposals: dao.proposals || 0,
        activeProposals: dao.activeProposals || 0,
        tags: dao.tags || [],
        _meta: {
          cached_at: Date.now(),
          member_count: dao.members.length,
          user_is_member: false, // Will be updated by other actions
          user_is_moderator: false,
          user_is_creator: false,
          last_activity: Date.now(),
          trending_score: 0,
        },
      }));
      
      return { daos: reduxDAOs };
    } catch (error) {
      console.error('[Redux] Error fetching trending DAOs:', error);
      // Return empty array instead of mock data on error
      return { daos: [] };
    }
  }
);

export const fetchDAOById = createAsyncThunk(
  'daoCommunities/fetchDAOById',
  async (daoId: string, { getState }) => {
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Fetching DAO by ID from Nostr network:', daoId);
      
      // Use the actual DAO service to fetch specific DAO from Nostr
      const dao = await daoService.getDAOById(daoId);
      
      if (!dao) {
        console.log('[Redux] DAO not found:', daoId);
        return null;
      }
      
      console.log('[Redux] Fetched DAO from Nostr:', dao.name);
      
      // Convert DAO object to ReduxDAO format
      const reduxDAO: ReduxDAO = {
        id: dao.id,
        name: dao.name,
        description: dao.description,
        image: dao.image || '',
        avatar: dao.avatar || '',
        banner: dao.banner || '',
        creator: dao.creator,
        createdAt: dao.createdAt,
        members: dao.members,
        moderators: dao.moderators || [],
        bannedMembers: dao.bannedMembers || [],
        guidelines: dao.guidelines || '',
        isPrivate: dao.isPrivate || false,
        treasury: dao.treasury || { balance: 0, tokenSymbol: 'ALPH' },
        proposals: dao.proposals || 0,
        activeProposals: dao.activeProposals || 0,
        tags: dao.tags || [],
        _meta: {
          cached_at: Date.now(),
          member_count: dao.members.length,
          user_is_member: false, // Will be updated by other actions
          user_is_moderator: false,
          user_is_creator: false,
          last_activity: Date.now(),
          trending_score: 0,
        },
      };
      
      return reduxDAO;
    } catch (error) {
      console.error('[Redux] Error fetching DAO by ID:', error);
      return null;
    }
  }
);

export const createDAO = createAsyncThunk(
  'daoCommunities/createDAO',
  async (params: {
    name: string;
    description: string;
    tags?: string[];
    avatar?: string;
    banner?: string;
    isPrivate?: boolean;
  }, { dispatch, rejectWithValue }) => {
    const { name, description, tags = [], avatar, banner, isPrivate = false } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Creating DAO with real Nostr service:', { name, description, tags, avatar, banner });
      
      // Use the actual DAO service which handles Nostr event signing
      const eventId = await daoService.createDAO(name, description, tags, avatar, banner);
      
      if (!eventId) {
        throw new Error('Failed to create DAO - no event ID returned');
      }
      
      console.log('[Redux] DAO created successfully with event ID:', eventId);
      
      // Get current user pubkey from nostr service
      const { nostrService } = await import('../../lib/nostr');
      const currentUserPubkey = nostrService.publicKey;
      
      if (!currentUserPubkey) {
        throw new Error('User not authenticated');
      }
      
      // Create the Redux DAO object with the real event ID
      const newDAO: ReduxDAO = {
        id: eventId, // Use the actual Nostr event ID
        name,
        description,
        image: avatar || `https://picsum.photos/200/200?random=${Date.now()}`, // Use avatar as fallback for legacy image field
        avatar,
        banner,
        creator: currentUserPubkey,
        createdAt: Math.floor(Date.now() / 1000),
        members: [currentUserPubkey],
        moderators: [currentUserPubkey],
        bannedMembers: [],
        guidelines: '',
        isPrivate,
        treasury: {
          balance: 0,
          tokenSymbol: 'ALPH',
        },
        proposals: 0,
        activeProposals: 0,
        tags,
        _meta: {
          cached_at: Date.now(),
          member_count: 1,
          user_is_member: true,
          user_is_moderator: true,
          user_is_creator: true,
          last_activity: Date.now(),
          trending_score: 0,
        },
      };
      
      return newDAO;
    } catch (error) {
      console.error('[Redux] Error creating DAO:', error);
      return rejectWithValue(`Failed to create DAO: ${error}`);
    }
  }
);

export const joinDAO = createAsyncThunk(
  'daoCommunities/joinDAO',
  async (params: {
    daoId: string;
    userPubkey: string;
  }, { dispatch, rejectWithValue }) => {
    const { daoId, userPubkey } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Joining DAO with real Nostr service:', { daoId, userPubkey });
      
      // Use the actual DAO service which handles Nostr event signing
      const success = await daoService.joinDAO(daoId);
      
      if (!success) {
        throw new Error('Failed to join DAO');
      }
      
      console.log('[Redux] Successfully joined DAO:', daoId);
      
      return { daoId, userPubkey, joinedAt: Date.now() };
    } catch (error) {
      console.error('[Redux] Error joining DAO:', error);
      return rejectWithValue(`Failed to join DAO: ${error}`);
    }
  }
);

export const leaveDAO = createAsyncThunk(
  'daoCommunities/leaveDAO',
  async (params: {
    daoId: string;
    userPubkey: string;
  }, { dispatch, rejectWithValue }) => {
    const { daoId, userPubkey } = params;
    
    try {
      // Import the DAO service dynamically to avoid circular dependencies
      const { daoService } = await import('../../lib/dao/dao-service');
      
      console.log('[Redux] Leaving DAO with real Nostr service:', { daoId, userPubkey });
      
      // Use the actual DAO service which handles Nostr event signing
      const success = await daoService.leaveDAO(daoId);
      
      if (!success) {
        throw new Error('Failed to leave DAO');
      }
      
      console.log('[Redux] Successfully left DAO:', daoId);
      
      return { daoId, userPubkey, leftAt: Date.now() };
    } catch (error) {
      console.error('[Redux] Error leaving DAO:', error);
      return rejectWithValue(`Failed to leave DAO: ${error}`);
    }
  }
);

// Initial state
const initialState: DAOCommunitiesState = daoCommunitiesAdapter.getInitialState({
  loading: false,
  loadingMyDAOs: false,
  loadingTrending: false,
  error: null,
  myDAOs: {
    ids: [],
    cachedAt: null,
    isCacheFresh: true,
  },
  trendingDAOs: {
    ids: [],
    cachedAt: null,
  },
  featuredDAOs: {
    ids: [],
    cachedAt: null,
  },
  currentDAOId: null,
  searchResults: {
    query: '',
    results: [],
    loading: false,
  },
  metrics: {
    totalCommunities: 0,
    userMemberships: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
  },
});

// Slice definition
const daoCommunitiesSlice = createSlice({
  name: 'daoCommunities',
  initialState,
  reducers: {
    // Set current DAO for viewing
    setCurrentDAO: (state, action: PayloadAction<string | null>) => {
      state.currentDAOId = action.payload;
    },
    
    // Update DAO metadata
    updateDAOMetadata: (state, action: PayloadAction<{
      daoId: string;
      updates: Partial<ReduxDAO>;
    }>) => {
      const { daoId, updates } = action.payload;
      const dao = state.entities[daoId];
      if (dao) {
        Object.assign(dao, updates);
        dao._meta.cached_at = Date.now();
      }
    },
    
    // Update user relationship with DAO
    updateUserDAORelationship: (state, action: PayloadAction<{
      daoId: string;
      isMember: boolean;
      isModerator: boolean;
      isCreator: boolean;
    }>) => {
      const { daoId, isMember, isModerator, isCreator } = action.payload;
      const dao = state.entities[daoId];
      if (dao) {
        dao._meta.user_is_member = isMember;
        dao._meta.user_is_moderator = isModerator;
        dao._meta.user_is_creator = isCreator;
        dao._meta.cached_at = Date.now();
      }
    },
    
    // Search DAOs
    searchDAOs: (state, action: PayloadAction<string>) => {
      const query = action.payload.toLowerCase();
      state.searchResults.query = query;
      state.searchResults.loading = true;
      
      if (query.trim() === '') {
        state.searchResults.results = [];
        state.searchResults.loading = false;
        return;
      }
      
      // Simple client-side search (will be enhanced with server-side search)
      const results = state.ids.filter(id => {
        const dao = state.entities[id];
        return dao && (
          dao.name.toLowerCase().includes(query) ||
          dao.description.toLowerCase().includes(query) ||
          dao.tags.some(tag => tag.toLowerCase().includes(query))
        );
      });
      
      state.searchResults.results = results;
      state.searchResults.loading = false;
    },
    
    // Clear search results
    clearSearch: (state) => {
      state.searchResults = {
        query: '',
        results: [],
        loading: false,
      };
    },
    
    // Update metrics
    updateMetrics: (state, action: PayloadAction<Partial<DAOCommunitiesState['metrics']>>) => {
      state.metrics = { ...state.metrics, ...action.payload };
    },
    
    // Reset state
    resetDAOCommunities: (state) => {
      daoCommunitiesAdapter.removeAll(state);
      state.myDAOs = { ids: [], cachedAt: null, isCacheFresh: true };
      state.trendingDAOs = { ids: [], cachedAt: null };
      state.featuredDAOs = { ids: [], cachedAt: null };
      state.currentDAOId = null;
      state.searchResults = { query: '', results: [], loading: false };
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch DAOs
      .addCase(fetchDAOs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDAOs.fulfilled, (state, action) => {
        state.loading = false;
        const { daos } = action.payload;
        daoCommunitiesAdapter.upsertMany(state, daos);
        state.metrics.totalCommunities = state.ids.length;
      })
      .addCase(fetchDAOs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch DAOs';
      })
      
      // Fetch My DAOs
      .addCase(fetchMyDAOs.pending, (state) => {
        state.loadingMyDAOs = true;
        state.error = null;
      })
      .addCase(fetchMyDAOs.fulfilled, (state, action) => {
        state.loadingMyDAOs = false;
        const { daos } = action.payload;
        daoCommunitiesAdapter.upsertMany(state, daos);
        state.myDAOs = {
          ids: daos.map(dao => dao.id),
          cachedAt: Date.now(),
          isCacheFresh: true,
        };
        state.metrics.userMemberships = daos.length;
      })
      .addCase(fetchMyDAOs.rejected, (state, action) => {
        state.loadingMyDAOs = false;
        state.error = action.error.message || 'Failed to fetch user DAOs';
      })
      
      // Fetch Trending DAOs
      .addCase(fetchTrendingDAOs.pending, (state) => {
        state.loadingTrending = true;
        state.error = null;
      })
      .addCase(fetchTrendingDAOs.fulfilled, (state, action) => {
        state.loadingTrending = false;
        const { daos } = action.payload;
        daoCommunitiesAdapter.upsertMany(state, daos);
        state.trendingDAOs = {
          ids: daos.map(dao => dao.id),
          cachedAt: Date.now(),
        };
      })
      .addCase(fetchTrendingDAOs.rejected, (state, action) => {
        state.loadingTrending = false;
        state.error = action.error.message || 'Failed to fetch trending DAOs';
      })
      
      // Fetch DAO by ID
      .addCase(fetchDAOById.fulfilled, (state, action) => {
        if (action.payload) {
          daoCommunitiesAdapter.upsertOne(state, action.payload);
        }
      })
      
      // Create DAO
      .addCase(createDAO.fulfilled, (state, action) => {
        const newDAO = action.payload;
        daoCommunitiesAdapter.addOne(state, newDAO);
        
        // Add to user's DAOs
        if (!state.myDAOs.ids.includes(newDAO.id)) {
          state.myDAOs.ids.unshift(newDAO.id);
          state.myDAOs.cachedAt = Date.now();
        }
        
        state.metrics.totalCommunities++;
        state.metrics.userMemberships++;
      })
      
      // Join DAO
      .addCase(joinDAO.fulfilled, (state, action) => {
        const { daoId, userPubkey } = action.payload;
        const dao = state.entities[daoId];
        if (dao) {
          if (!dao.members.includes(userPubkey)) {
            dao.members.push(userPubkey);
            dao._meta.member_count++;
          }
          dao._meta.user_is_member = true;
          dao._meta.cached_at = Date.now();
          
          // Add to user's DAOs if not already there
          if (!state.myDAOs.ids.includes(daoId)) {
            state.myDAOs.ids.unshift(daoId);
            state.myDAOs.cachedAt = Date.now();
            state.metrics.userMemberships++;
          }
        }
      })
      
      // Leave DAO
      .addCase(leaveDAO.fulfilled, (state, action) => {
        const { daoId, userPubkey } = action.payload;
        const dao = state.entities[daoId];
        if (dao) {
          dao.members = dao.members.filter(member => member !== userPubkey);
          dao._meta.member_count = Math.max(0, dao._meta.member_count - 1);
          dao._meta.user_is_member = false;
          dao._meta.user_is_moderator = false;
          dao._meta.cached_at = Date.now();
          
          // Remove from user's DAOs
          state.myDAOs.ids = state.myDAOs.ids.filter(id => id !== daoId);
          state.myDAOs.cachedAt = Date.now();
          state.metrics.userMemberships = Math.max(0, state.metrics.userMemberships - 1);
        }
      });
  },
});

// Export actions
export const {
  setCurrentDAO,
  updateDAOMetadata,
  updateUserDAORelationship,
  searchDAOs,
  clearSearch,
  updateMetrics,
  resetDAOCommunities,
} = daoCommunitiesSlice.actions;

// Export entity selectors
export const {
  selectAll: selectAllDAOs,
  selectById: selectDAOById,
  selectIds: selectDAOIds,
  selectEntities: selectDAOEntities,
  selectTotal: selectTotalDAOs,
} = daoCommunitiesAdapter.getSelectors();

// Custom selectors
export const selectMyDAOs = (state: any) => {
  const daoState = state.daoCommunities;
  return daoState.myDAOs.ids.map((id: string) => daoState.entities[id]).filter(Boolean);
};

export const selectTrendingDAOs = (state: any) => {
  const daoState = state.daoCommunities;
  return daoState.trendingDAOs.ids.map((id: string) => daoState.entities[id]).filter(Boolean);
};

export const selectCurrentDAO = (state: any) => {
  const daoState = state.daoCommunities;
  return daoState.currentDAOId ? daoState.entities[daoState.currentDAOId] : null;
};

export const selectDAOsByTag = (state: any, tag: string) => {
  return selectAllDAOs(state.daoCommunities).filter((dao: ReduxDAO) => 
    dao.tags.includes(tag)
  );
};

export const selectUserMemberDAOs = (state: any) => {
  return selectAllDAOs(state.daoCommunities).filter((dao: ReduxDAO) => 
    dao._meta.user_is_member
  );
};

export const selectUserModeratorDAOs = (state: any) => {
  return selectAllDAOs(state.daoCommunities).filter((dao: ReduxDAO) => 
    dao._meta.user_is_moderator
  );
};

export const selectSearchResults = (state: any) => {
  const daoState = state.daoCommunities;
  return daoState.searchResults.results.map((id: string) => daoState.entities[id]).filter(Boolean);
};

export const selectDAOMetrics = (state: any) => state.daoCommunities.metrics;

// Export reducer
export default daoCommunitiesSlice.reducer; 

