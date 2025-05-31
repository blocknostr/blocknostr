import { createSlice, createEntityAdapter, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  ReduxWalletToken, 
  WalletTokensState 
} from '../types';
import type { RootState } from '../index';

// Entity adapter for normalized token storage
const walletTokenAdapter = createEntityAdapter<ReduxWalletToken>({
  selectId: (token) => token.id,
  sortComparer: (a, b) => {
    // Sort by: value (USD) descending, then by amount
    const valueA = a.usdValue || 0;
    const valueB = b.usdValue || 0;
    
    if (valueA !== valueB) return valueB - valueA;
    return parseFloat(b.amount) - parseFloat(a.amount);
  },
});

// ===== ASYNC THUNKS =====
// Note: Pricing is now handled by walletApi.ts getTokenPrices endpoint
// This slice focuses on token metadata and categorization only

/**
 * Refresh token metadata (logos, names, etc.)
 */
export const refreshTokenMetadata = createAsyncThunk(
  'walletTokens/refreshTokenMetadata',
  async (tokenId: string, { getState, rejectWithValue }) => {
    try {
      console.log(`[Redux] Refreshing metadata for token: ${tokenId}`);
      
      // This would call the actual token metadata API
      // For now, just return updated timestamp
      const metadataUpdate = {
        _meta: {
          cached_at: Date.now(),
        },
      };
      
      return { tokenId, metadata: metadataUpdate };
    } catch (error) {
      console.error('[Redux] Error refreshing token metadata:', error);
      return rejectWithValue(`Failed to refresh token metadata: ${error}`);
    }
  }
);

/**
 * Categorize tokens (verified, LP, experimental, etc.)
 */
export const categorizeTokens = createAsyncThunk(
  'walletTokens/categorizeTokens',
  async (walletAddress: string, { getState }) => {
    const state = getState() as RootState;
    const allTokens = Object.values(state.walletTokens.entities);
    const walletTokens = allTokens.filter(t => t && t.walletAddress === walletAddress);
    
    const categories = {
      verified: walletTokens.filter(t => t && t.isVerified && !t.isNFT).map(t => t!.id),
      lpTokens: walletTokens.filter(t => t && t.category === 'lp').map(t => t!.id),
      experimental: walletTokens.filter(t => t && t.riskLevel === 'high').map(t => t!.id),
      nfts: walletTokens.filter(t => t && t.isNFT).map(t => t!.id),
    };
    
    return { walletAddress, categories };
  }
);

// ===== SLICE DEFINITION =====

const initialState: WalletTokensState = walletTokenAdapter.getInitialState({
  loading: false,
  loadingPrices: {},
  error: null,
  tokensByWallet: {},
  priceUpdates: {},
  categories: {
    verified: [],
    lpTokens: [],
    experimental: [],
    nfts: [],
  },
});

const walletTokensSlice = createSlice({
  name: 'walletTokens',
  initialState,
  reducers: {
    // Synchronous actions
    clearTokenError: (state) => {
      state.error = null;
    },
    
    updateTokenCategory: (state, action: PayloadAction<{
      tokenId: string;
      category: 'token' | 'nft' | 'lp' | 'other';
    }>) => {
      const { tokenId, category } = action.payload;
      const token = state.entities[tokenId];
      if (token) {
        token.category = category;
      }
    },
    
    setTokenRiskLevel: (state, action: PayloadAction<{
      tokenId: string;
      riskLevel: 'low' | 'medium' | 'high' | 'unknown';
    }>) => {
      const { tokenId, riskLevel } = action.payload;
      const token = state.entities[tokenId];
      if (token) {
        token.riskLevel = riskLevel;
      }
    },
    
    markTokenAsVerified: (state, action: PayloadAction<{
      tokenId: string;
      isVerified: boolean;
    }>) => {
      const { tokenId, isVerified } = action.payload;
      const token = state.entities[tokenId];
      if (token) {
        token.isVerified = isVerified;
      }
    },
    
    updateTokenAmount: (state, action: PayloadAction<{
      tokenId: string;
      amount: string;
      formattedAmount?: string;
    }>) => {
      const { tokenId, amount, formattedAmount } = action.payload;
      const token = state.entities[tokenId];
      if (token) {
        token.amount = amount;
        token.formattedAmount = formattedAmount || parseFloat(amount).toFixed(4);
        
        // Note: USD value recalculation now handled by walletApi.ts pricing
      }
    },
    
    clearWalletTokens: (state, action: PayloadAction<string>) => {
      const walletAddress = action.payload;
      
      // Remove all tokens for this wallet
      const tokenIdsToRemove = Object.values(state.entities)
        .filter(token => token && token.walletAddress === walletAddress)
        .map(token => token!.id);
      
      walletTokenAdapter.removeMany(state, tokenIdsToRemove);
      
      // Clear wallet-specific data
      delete state.tokensByWallet[walletAddress];
      delete state.loadingPrices[walletAddress];
    },
    
    setPriceLoading: (state, action: PayloadAction<{
      walletAddress: string;
      loading: boolean;
    }>) => {
      const { walletAddress, loading } = action.payload;
      state.loadingPrices[walletAddress] = loading;
    },
  },
  
  extraReducers: (builder) => {
    // Refresh token metadata
    builder
      .addCase(refreshTokenMetadata.fulfilled, (state, action) => {
        const { tokenId, metadata } = action.payload;
        const token = state.entities[tokenId];
        if (token) {
          Object.assign(token, metadata);
        }
      });
    
    // Categorize tokens
    builder
      .addCase(categorizeTokens.fulfilled, (state, action) => {
        const { categories } = action.payload;
        state.categories = categories;
      });
  },
});

// ===== ACTIONS =====
export const {
  clearTokenError,
  updateTokenCategory,
  setTokenRiskLevel,
  markTokenAsVerified,
  updateTokenAmount,
  clearWalletTokens,
  setPriceLoading,
} = walletTokensSlice.actions;

// ===== SELECTORS =====
export const {
  selectAll: selectAllTokens,
  selectById: selectTokenById,
  selectIds: selectTokenIds,
} = walletTokenAdapter.getSelectors((state: RootState) => state.walletTokens);

export const selectTokensByWallet = (state: RootState, walletAddress: string) =>
  selectAllTokens(state).filter(token => token.walletAddress === walletAddress);

export const selectRegularTokensByWallet = (state: RootState, walletAddress: string) =>
  selectTokensByWallet(state, walletAddress).filter(token => !token.isNFT);

export const selectNFTsByWallet = (state: RootState, walletAddress: string) =>
  selectTokensByWallet(state, walletAddress).filter(token => token.isNFT);

export const selectVerifiedTokens = (state: RootState) =>
  selectAllTokens(state).filter(token => token.isVerified && !token.isNFT);

export const selectHighRiskTokens = (state: RootState) =>
  selectAllTokens(state).filter(token => token.riskLevel === 'high');

export const selectTokensLoading = (state: RootState, walletAddress: string) =>
  state.walletTokens.loadingPrices[walletAddress] || state.walletTokens.loading;

export const selectWalletTokenValue = (state: RootState, walletAddress: string) => {
  const walletData = state.walletTokens.tokensByWallet[walletAddress];
  return walletData?.totalValue || 0;
};

export const selectTokensByCategory = (state: RootState, category: keyof WalletTokensState['categories']) =>
  state.walletTokens.categories[category].map(id => state.walletTokens.entities[id]).filter(Boolean);

export const selectRecentPriceUpdates = (state: RootState) => {
  const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
  return Object.entries(state.walletTokens.priceUpdates)
    .filter(([, timestamp]) => timestamp > cutoffTime);
};

export const selectTopTokensByValue = (state: RootState, limit = 10) =>
  selectAllTokens(state)
    .filter(token => !token.isNFT && (token.usdValue || 0) > 0)
    .sort((a, b) => (b.usdValue || 0) - (a.usdValue || 0))
    .slice(0, limit);

// ===== REDUCER =====
export default walletTokensSlice.reducer; 

