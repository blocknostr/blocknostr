import { configureStore, combineReducers, Middleware } from '@reduxjs/toolkit';
import { 
  persistStore, 
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { setupListeners } from '@reduxjs/toolkit/query';

// ✅ UPDATED: Base API imports from reorganized structure
import { nostrApi } from '../api/rtk/nostrApi';
import daoApi from '../api/rtk/daoApi';
import walletApi from '../api/rtk/walletApi';
import { profileApi } from '../api/rtk/profileApi';
import { eventsApi } from '../api/rtk/eventsApi';

// Slice reducers
import appReducer from './slices/appSlice';
import daoCommunitiesReducer from './slices/daoCommunitiesSlice';
import daoProposalsReducer from './slices/daoProposalsSlice';
import walletManagementReducer from './slices/walletManagementSlice';
import walletTokensReducer from './slices/walletTokensSlice';
import walletConnectionsReducer from './slices/walletConnectionsSlice';
import articlesReducer from './slices/articlesSlice';

// Phase 6: NIP-compliant Social Graph and Enhanced Profiles
import identityVerificationReducer from './slices/identityVerificationSlice';
import userListsReducer from './slices/userListsSlice';
import profilesReducer from './slices/profileSlice';
import identitySlice from './slices/identitySlice';
import chatSlice from './slices/chatSlice';
// UI State Management
import uiReducer from './slices/uiSlice';
// LocalStorage State Management
import localStorageReducer from './slices/localStorageSlice';

// Custom middleware for real-time updates and performance monitoring
import nostrRealtimeMiddleware from './middleware/nostrRealtimeMiddleware';
import daoRealtimeMiddleware from './middleware/daoRealtimeMiddleware';
import walletRealtimeMiddleware from './middleware/walletRealtimeMiddleware';
import performanceMiddleware from './middleware/performanceMiddleware';

// Root reducer configuration
const rootReducer = combineReducers({
  // App state (persisted)
  app: appReducer,
  
  // UI state
  ui: uiReducer,
  
  // LocalStorage state
  localStorage: localStorageReducer,
  
  // ✅ NEW: Articles management (persisted for drafts)
  articles: articlesReducer,
  
  // DAO state
  daoCommunities: daoCommunitiesReducer, // Persisted for user's DAO memberships
  daoProposals: daoProposalsReducer, // Not persisted (real-time nature)
  
  // Wallet state
  walletManagement: walletManagementReducer, // Persisted for user's wallet list and metadata
  walletTokens: walletTokensReducer, // Not persisted (real-time prices, cache invalidation)
  walletConnections: walletConnectionsReducer, // Persisted for connection preferences and security settings
  
  // NIP-compliant Social Graph and Enhanced Profiles
  identityVerification: identityVerificationReducer,
  userLists: userListsReducer,
  identity: identitySlice,
  
  // Unified profile management
  profiles: profilesReducer,
  
  // RTK Query APIs
  [nostrApi.reducerPath]: nostrApi.reducer,
  [daoApi.reducerPath]: daoApi.reducer,
  [walletApi.reducerPath]: walletApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [eventsApi.reducerPath]: eventsApi.reducer,
  
  // Regular slices
  chat: chatSlice,
});

// Redux persist configuration
const persistConfig = {
  key: 'blocknostr-redux',
  version: 1,
  storage,
  whitelist: [
    'app',
    'ui',
    'localStorage',
    'articles',
    'daoCommunities',
    'walletManagement',
    'walletConnections',
    'profiles',
    'identity',
  ],
  blacklist: [
    'daoProposals', // Don't persist proposals (real-time voting, cache invalidation)
    'walletTokens', // Don't persist tokens (real-time prices, frequent updates)
    nostrApi.reducerPath, // Don't persist API cache
    daoApi.reducerPath, // Don't persist API cache
    walletApi.reducerPath, // Don't persist API cache
    profileApi.reducerPath, // Don't persist API cache
    eventsApi.reducerPath, // Don't persist API cache
  ],
};

// Create persistedReducer with the configuration
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Middleware array to improve readability
const apiMiddleware = [
  nostrApi.middleware,
  daoApi.middleware,
  walletApi.middleware,
  profileApi.middleware,
  eventsApi.middleware,
];

const realtimeMiddleware = [
  nostrRealtimeMiddleware,
  daoRealtimeMiddleware,
  walletRealtimeMiddleware,
];

const otherMiddleware = [
  performanceMiddleware,
];

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          'register',
          // ✅ NEW: Skip serializable check for large market data
          'walletApi.queries',
          'eventsApi.queries', 
          'nostrApi.queries',
          'daoApi.queries',
          'profileApi.queries',
        ],
        // ✅ NEW: Increase warnAfter for serializable check
        warnAfter: 64, // Default is 32ms, increase for large payloads
      },
      immutableCheck: {
        ignoredPaths: [
          'daoCommunities.entities',
          'daoProposals.entities',
          'profileApi.queries',
          'eventsApi.queries',
          // ✅ NEW: Ignore more paths that contain large, frequently updated data
          'walletApi.queries',    // Crypto market data queries
          'nostrApi.queries',     // Large event data queries  
          'daoApi.queries',       // DAO data queries
          'walletTokens',         // Token price data
          'walletManagement.portfolios', // Portfolio data
          'profiles.entities',    // Cached profile entities
          'chat.messages',        // Chat message arrays
          walletApi.reducerPath,  // RTK Query cache paths
          nostrApi.reducerPath,
          eventsApi.reducerPath,
          profileApi.reducerPath,
          daoApi.reducerPath,
        ],
        // ✅ NEW: Increase warnAfter threshold to reduce warnings for complex operations  
        warnAfter: 128, // Default is 32ms, increase to 128ms for large state operations
      },
    })
    .concat(...apiMiddleware)
    .concat(...realtimeMiddleware)
    .concat(...otherMiddleware),
});

// Create the persisted store
export const persistor = persistStore(store);

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Essential development helpers only
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).__REDUX_STORE__ = store;
    (window as any).__REDUX_HELPERS__ = {
      getState: () => store.getState(),
      dispatch: (action: any) => store.dispatch(action),
      clearRTKCache: () => {
        store.dispatch(profileApi.util.resetApiState());
        store.dispatch(eventsApi.util.resetApiState());
        store.dispatch(nostrApi.util.resetApiState());
        store.dispatch(walletApi.util.resetApiState());
        store.dispatch(daoApi.util.resetApiState());
      },
    };
  }
}

export default store;

