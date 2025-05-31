import { createSlice, createEntityAdapter, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { 
  ReduxWallet, 
  WalletManagementState, 
  WalletType 
} from '../types';
import type { RootState } from '../index';

// Entity adapter for normalized wallet storage
const walletAdapter = createEntityAdapter<ReduxWallet>({
  selectId: (wallet) => wallet.address,
  sortComparer: (a, b) => {
    // Sort by: connected first, then by dateAdded (newest first)
    if (a.isConnected && !b.isConnected) return -1;
    if (!a.isConnected && b.isConnected) return 1;
    return b.dateAdded - a.dateAdded;
  },
});

// ===== ASYNC THUNKS =====

/**
 * Fetch wallet balance and basic info
 */
export const fetchWalletData = createAsyncThunk(
  'walletManagement/fetchWalletData',
  async (params: { address: string; forceRefresh?: boolean }, { getState, rejectWithValue }) => {
    try {
      const { address, forceRefresh = false } = params;
      const state = getState() as RootState;
      
      // Check if we should refresh based on cache
      const existingWallet = state.walletManagement.entities[address];
      if (!forceRefresh && existingWallet && !existingWallet._meta.is_stale) {
        const cacheAge = Date.now() - existingWallet._meta.cached_at;
        if (cacheAge < existingWallet._meta.refresh_interval) {
          return existingWallet; // Return cached data
        }
      }

      console.log(`[Redux] Fetching wallet data for ${address}`);
      
      // This will be replaced with actual wallet service calls
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock wallet data - replace with actual API calls
      const walletData: ReduxWallet = {
        address,
        label: existingWallet?.label || `Wallet ${address.slice(0, 8)}`,
        network: existingWallet?.network || 'Alephium',
        isWatchOnly: existingWallet?.isWatchOnly ?? true,
        isConnected: existingWallet?.isConnected ?? false,
        dateAdded: existingWallet?.dateAdded || Date.now(),
        lastUpdated: Date.now(),
        balance: {
          balance: Math.random() * 1000,
          lockedBalance: Math.random() * 100,
          utxoNum: Math.floor(Math.random() * 50),
          usdValue: Math.random() * 500,
        },
        stats: {
          transactionCount: Math.floor(Math.random() * 100),
          receivedAmount: Math.random() * 5000,
          sentAmount: Math.random() * 3000,
          tokenCount: Math.floor(Math.random() * 20),
          nftCount: Math.floor(Math.random() * 5),
          totalValueUSD: Math.random() * 1000,
          totalValueALPH: Math.random() * 2000,
          lastActivity: Date.now() - Math.random() * 86400000,
        },
        _meta: {
          cached_at: Date.now(),
          is_stale: false,
          retry_count: 0,
          last_refresh: Date.now(),
          refresh_interval: 300000, // 5 minutes
          auto_refresh: true,
          is_refreshing: false,
          error_count: 0,
          performance_score: 0.9,
          cache_hit_rate: 0.85,
        },
      };

      return walletData;
    } catch (error) {
      console.error('[Redux] Error fetching wallet data:', error);
      return rejectWithValue(`Failed to fetch wallet data: ${error}`);
    }
  }
);

/**
 * Add a new wallet to tracking
 */
export const addWallet = createAsyncThunk(
  'walletManagement/addWallet',
  async (params: {
    address: string;
    label: string;
    network: WalletType;
    isWatchOnly?: boolean;
  }, { dispatch, rejectWithValue }) => {
    try {
      const { address, label, network, isWatchOnly = true } = params;
      
      console.log(`[Redux] Adding wallet: ${address}`);
      
      // Create wallet entry
      const newWallet: ReduxWallet = {
        address,
        label,
        network,
        isWatchOnly,
        isConnected: false,
        dateAdded: Date.now(),
        lastUpdated: Date.now(),
        balance: {
          balance: 0,
          lockedBalance: 0,
          utxoNum: 0,
        },
        stats: {
          transactionCount: 0,
          receivedAmount: 0,
          sentAmount: 0,
          tokenCount: 0,
          nftCount: 0,
          totalValueUSD: 0,
          totalValueALPH: 0,
          lastActivity: 0,
        },
        _meta: {
          cached_at: Date.now(),
          is_stale: true, // Mark as stale so it gets refreshed
          retry_count: 0,
          last_refresh: 0,
          refresh_interval: 300000,
          auto_refresh: true,
          is_refreshing: false,
          error_count: 0,
          performance_score: 1.0,
          cache_hit_rate: 0,
        },
      };

      // Fetch initial data for the wallet
      dispatch(fetchWalletData({ address, forceRefresh: true }));
      
      return newWallet;
    } catch (error) {
      console.error('[Redux] Error adding wallet:', error);
      return rejectWithValue(`Failed to add wallet: ${error}`);
    }
  }
);

/**
 * Remove wallet from tracking
 */
export const removeWallet = createAsyncThunk(
  'walletManagement/removeWallet',
  async (address: string, { rejectWithValue }) => {
    try {
      console.log(`[Redux] Removing wallet: ${address}`);
      return address;
    } catch (error) {
      console.error('[Redux] Error removing wallet:', error);
      return rejectWithValue(`Failed to remove wallet: ${error}`);
    }
  }
);

/**
 * Update wallet metadata
 */
export const updateWalletMetadata = createAsyncThunk(
  'walletManagement/updateWalletMetadata',
  async (params: {
    address: string;
    updates: Partial<Pick<ReduxWallet, 'label' | 'network' | 'isWatchOnly'>>;
  }, { rejectWithValue }) => {
    try {
      const { address, updates } = params;
      console.log(`[Redux] Updating wallet metadata: ${address}`, updates);
      
      return { address, updates };
    } catch (error) {
      console.error('[Redux] Error updating wallet metadata:', error);
      return rejectWithValue(`Failed to update wallet: ${error}`);
    }
  }
);

/**
 * Connect to wallet provider
 */
export const connectWallet = createAsyncThunk(
  'walletManagement/connectWallet',
  async (params: { address: string; type: WalletType }, { dispatch, rejectWithValue }) => {
    try {
      const { address, type } = params;
      console.log(`[Redux] Connecting to wallet: ${address}`);
      
      // Simulate wallet connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update wallet as connected and fetch fresh data
      dispatch(fetchWalletData({ address, forceRefresh: true }));
      
      return { address, isConnected: true, connectedAt: Date.now() };
    } catch (error) {
      console.error('[Redux] Error connecting wallet:', error);
      return rejectWithValue(`Failed to connect wallet: ${error}`);
    }
  }
);

/**
 * Disconnect wallet
 */
export const disconnectWallet = createAsyncThunk(
  'walletManagement/disconnectWallet',
  async (address: string, { rejectWithValue }) => {
    try {
      console.log(`[Redux] Disconnecting wallet: ${address}`);
      
      return { address, isConnected: false };
    } catch (error) {
      console.error('[Redux] Error disconnecting wallet:', error);
      return rejectWithValue(`Failed to disconnect wallet: ${error}`);
    }
  }
);

/**
 * Refresh multiple wallets in bulk
 */
export const refreshWallets = createAsyncThunk(
  'walletManagement/refreshWallets',
  async (addresses: string[], { dispatch, getState }) => {
    const results = await Promise.allSettled(
      addresses.map(address => 
        dispatch(fetchWalletData({ address, forceRefresh: true }))
      )
    );
    
    return {
      successful: addresses.filter((_, index) => results[index].status === 'fulfilled'),
      failed: addresses.filter((_, index) => results[index].status === 'rejected'),
    };
  }
);

// ===== SLICE DEFINITION =====

const initialState: WalletManagementState = walletAdapter.getInitialState({
  loading: false,
  loadingBalances: {},
  loadingTokens: {},
  loadingTransactions: {},
  error: null,
  walletErrors: {},
  selectedWallet: null,
  connectedWallet: null,
  bulkOperations: {
    refreshing: [],
    importing: [],
    exporting: [],
  },
  metrics: {
    totalWallets: 0,
    connectedWallets: 0,
    averageRefreshTime: 0,
    cacheHitRate: 0,
    totalValueTracked: 0,
  },
});

const walletManagementSlice = createSlice({
  name: 'walletManagement',
  initialState,
  reducers: {
    // Synchronous actions
    selectWallet: (state, action: PayloadAction<string | null>) => {
      state.selectedWallet = action.payload;
    },
    
    clearWalletError: (state, action: PayloadAction<string>) => {
      delete state.walletErrors[action.payload];
    },
    
    clearAllErrors: (state) => {
      state.error = null;
      state.walletErrors = {};
    },
    
    setWalletStale: (state, action: PayloadAction<string>) => {
      const wallet = state.entities[action.payload];
      if (wallet) {
        wallet._meta.is_stale = true;
      }
    },
    
    updateWalletPreferences: (state, action: PayloadAction<{
      address: string;
      preferences: Partial<ReduxWallet['_meta']>;
    }>) => {
      const { address, preferences } = action.payload;
      const wallet = state.entities[address];
      if (wallet) {
        wallet._meta = { ...wallet._meta, ...preferences };
      }
    },
    
    startBulkOperation: (state, action: PayloadAction<{
      type: 'refreshing' | 'importing' | 'exporting';
      addresses: string[];
    }>) => {
      const { type, addresses } = action.payload;
      state.bulkOperations[type] = addresses;
    },
    
    finishBulkOperation: (state, action: PayloadAction<{
      type: 'refreshing' | 'importing' | 'exporting';
    }>) => {
      const { type } = action.payload;
      state.bulkOperations[type] = [];
    },
    
    updateMetrics: (state, action: PayloadAction<Partial<WalletManagementState['metrics']>>) => {
      state.metrics = { ...state.metrics, ...action.payload };
    },
  },
  
  extraReducers: (builder) => {
    // Fetch wallet data
    builder
      .addCase(fetchWalletData.pending, (state, action) => {
        const address = action.meta.arg.address;
        state.loadingBalances[address] = true;
        delete state.walletErrors[address];
        
        // Mark wallet as refreshing
        const wallet = state.entities[address];
        if (wallet) {
          wallet._meta.is_refreshing = true;
        }
      })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        const wallet = action.payload;
        const address = wallet.address;
        
        walletAdapter.upsertOne(state, wallet);
        state.loadingBalances[address] = false;
        
        // Update metrics
        state.metrics.totalWallets = state.ids.length;
        state.metrics.connectedWallets = Object.values(state.entities)
          .filter(w => w.isConnected).length;
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        const address = action.meta.arg.address;
        state.loadingBalances[address] = false;
        state.walletErrors[address] = action.payload as string;
        
        // Increment error count for the wallet
        const wallet = state.entities[address];
        if (wallet) {
          wallet._meta.error_count += 1;
          wallet._meta.is_refreshing = false;
          wallet._meta.is_stale = true;
        }
      });
    
    // Add wallet
    builder
      .addCase(addWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWallet.fulfilled, (state, action) => {
        walletAdapter.addOne(state, action.payload);
        state.loading = false;
        
        // Auto-select if it's the first wallet
        if (state.ids.length === 1) {
          state.selectedWallet = action.payload.address;
        }
        
        // Update metrics
        state.metrics.totalWallets = state.ids.length;
      })
      .addCase(addWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Remove wallet
    builder
      .addCase(removeWallet.fulfilled, (state, action) => {
        const address = action.payload;
        walletAdapter.removeOne(state, address);
        
        // Clear related state
        delete state.loadingBalances[address];
        delete state.loadingTokens[address];
        delete state.loadingTransactions[address];
        delete state.walletErrors[address];
        
        // Update selection if removed wallet was selected
        if (state.selectedWallet === address) {
          state.selectedWallet = state.ids.length > 0 ? state.ids[0] : null;
        }
        
        if (state.connectedWallet === address) {
          state.connectedWallet = null;
        }
        
        // Update metrics
        state.metrics.totalWallets = state.ids.length;
        state.metrics.connectedWallets = Object.values(state.entities)
          .filter(w => w.isConnected).length;
      });
    
    // Update wallet metadata
    builder
      .addCase(updateWalletMetadata.fulfilled, (state, action) => {
        const { address, updates } = action.payload;
        const wallet = state.entities[address];
        if (wallet) {
          Object.assign(wallet, updates);
          wallet.lastUpdated = Date.now();
        }
      });
    
    // Connect wallet
    builder
      .addCase(connectWallet.pending, (state, action) => {
        const address = action.meta.arg.address;
        state.loadingBalances[address] = true;
      })
      .addCase(connectWallet.fulfilled, (state, action) => {
        const { address, isConnected } = action.payload;
        const wallet = state.entities[address];
        if (wallet) {
          wallet.isConnected = isConnected;
          wallet.isWatchOnly = false; // Connected wallets are not watch-only
          wallet.lastUpdated = Date.now();
        }
        
        state.loadingBalances[address] = false;
        state.connectedWallet = address;
        
        // Update metrics
        state.metrics.connectedWallets = Object.values(state.entities)
          .filter(w => w.isConnected).length;
      })
      .addCase(connectWallet.rejected, (state, action) => {
        const address = action.meta.arg.address;
        state.loadingBalances[address] = false;
        state.walletErrors[address] = action.payload as string;
      });
    
    // Disconnect wallet
    builder
      .addCase(disconnectWallet.fulfilled, (state, action) => {
        const { address, isConnected } = action.payload;
        const wallet = state.entities[address];
        if (wallet) {
          wallet.isConnected = isConnected;
          wallet.isWatchOnly = true; // Disconnected wallets become watch-only
          wallet.lastUpdated = Date.now();
        }
        
        if (state.connectedWallet === address) {
          state.connectedWallet = null;
        }
        
        // Update metrics
        state.metrics.connectedWallets = Object.values(state.entities)
          .filter(w => w.isConnected).length;
      });
    
    // Refresh wallets bulk operation
    builder
      .addCase(refreshWallets.pending, (state, action) => {
        state.bulkOperations.refreshing = action.meta.arg;
      })
      .addCase(refreshWallets.fulfilled, (state, action) => {
        state.bulkOperations.refreshing = [];
        // Results are handled by individual fetchWalletData actions
      })
      .addCase(refreshWallets.rejected, (state) => {
        state.bulkOperations.refreshing = [];
      });
  },
});

// ===== SELECTORS =====

// Entity adapter selectors
export const {
  selectAll: selectAllWallets,
  selectById: selectWalletById,
  selectIds: selectWalletIds,
  selectEntities: selectWalletEntities,
  selectTotal: selectTotalWallets,
} = walletAdapter.getSelectors((state: RootState) => state.walletManagement);

// Custom selectors
export const selectSelectedWallet = createSelector(
  [
    (state: RootState) => state.walletManagement.selectedWallet,
    (state: RootState) => state.walletManagement.entities
  ],
  (selectedId, entities) => selectedId ? entities[selectedId] : null
);

export const selectConnectedWallet = createSelector(
  [
    (state: RootState) => state.walletManagement.connectedWallet,
    (state: RootState) => state.walletManagement.entities
  ],
  (connectedId, entities) => connectedId ? entities[connectedId] : null
);

export const selectWalletsByNetwork = createSelector(
  [selectAllWallets, (state: RootState, network: WalletType) => network],
  (wallets, network) => wallets.filter(wallet => wallet.network === network)
);

export const selectConnectedWallets = createSelector(
  [selectAllWallets],
  (wallets) => wallets.filter(wallet => wallet.isConnected)
);

export const selectWatchOnlyWallets = createSelector(
  [selectAllWallets],
  (wallets) => wallets.filter(wallet => wallet.isWatchOnly)
);

export const selectStaleWallets = createSelector(
  [selectAllWallets],
  (wallets) => wallets.filter(wallet => wallet._meta.is_stale)
);

export const selectWalletLoading = (state: RootState, address: string) =>
  state.walletManagement.loadingBalances[address] || false;

export const selectWalletError = (state: RootState, address: string) =>
  state.walletManagement.walletErrors[address] || null;

export const selectWalletMetrics = (state: RootState) =>
  state.walletManagement.metrics;

export const selectBulkOperations = (state: RootState) =>
  state.walletManagement.bulkOperations;

export const selectTotalPortfolioValue = createSelector(
  [selectAllWallets],
  (wallets) => wallets.reduce((total, wallet) => 
    total + (wallet.stats.totalValueUSD || 0), 0
  )
);

export const selectWalletPerformanceScore = (state: RootState, address: string) => {
  const wallet = selectWalletById(state, address);
  return wallet?._meta.performance_score || 0;
};

// Export actions
export const {
  selectWallet,
  clearWalletError,
  clearAllErrors,
  setWalletStale,
  updateWalletPreferences,
  startBulkOperation,
  finishBulkOperation,
  updateMetrics,
} = walletManagementSlice.actions;

// Export reducer
export default walletManagementSlice.reducer; 

