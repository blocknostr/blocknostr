import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Feature flags interface
interface FeatureFlags {
  // Core Redux features (all enabled by default since migration is complete)
  useReduxForUI: boolean;
  useReduxForLocalStorage: boolean;
  useReduxForNotebin: boolean;
  useReduxForWalletPreferences: boolean;
  useReduxForThemePreferences: boolean;
  useRTKQueryForProfiles: boolean;
  useRTKQueryForEvents: boolean;
  useReduxForNostr: boolean;
  useReduxForWallet: boolean;
  useReduxForProfiles: boolean;
}

// Performance metrics interface
interface PerformanceMetrics {
  cacheHitRate: number;
  averageQueryTime: number;
  activeQueries: number;
  totalCacheSize: number;
  lastReset: number;
}

// App state interface
interface AppState {
  featureFlags: FeatureFlags;
  
  // App settings
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    debugMode: boolean;
    enableAnalytics: boolean;
  };
  
  // Performance metrics
  performance: PerformanceMetrics;
  
  // Connection status
  connectionStatus: {
    online: boolean;
    lastOnline: number | null;
  };
  
  // Notifications and toasts
  notifications: {
    unreadCount: number;
    lastChecked: number | null;
  };
}

// Initial state with safe defaults
const initialState: AppState = {
  featureFlags: {
    // All Redux features enabled by default since migration is complete
    useReduxForUI: true,
    useReduxForLocalStorage: true,
    useReduxForNotebin: true,
    useReduxForWalletPreferences: true,
    useReduxForThemePreferences: true,
    useRTKQueryForProfiles: true,
    useRTKQueryForEvents: true,
    useReduxForNostr: true,
    useReduxForWallet: true,
    useReduxForProfiles: true,
  },
  
  settings: {
    theme: 'system',
    language: 'en',
    debugMode: process.env.NODE_ENV === 'development',
    enableAnalytics: true,
  },
  
  performance: {
    cacheHitRate: 0,
    averageQueryTime: 0,
    activeQueries: 0,
    totalCacheSize: 0,
    lastReset: Date.now(),
  },
  
  connectionStatus: {
    online: navigator.onLine,
    lastOnline: navigator.onLine ? Date.now() : null,
  },
  
  notifications: {
    unreadCount: 0,
    lastChecked: null,
  },
};

// App slice
export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // Feature flag management
    setFeatureFlag: (state, action: PayloadAction<{ flag: keyof FeatureFlags; enabled: boolean }>) => {
      const { flag, enabled } = action.payload;
      state.featureFlags[flag] = enabled;
    },
    
    // Settings management
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.settings.theme = action.payload;
    },
    
    toggleDebugMode: (state) => {
      state.settings.debugMode = !state.settings.debugMode;
    },
    
    // Performance tracking
    updatePerformanceMetrics: (state, action: PayloadAction<Partial<PerformanceMetrics>>) => {
      state.performance = { ...state.performance, ...action.payload };
    },
    
    resetPerformanceMetrics: (state) => {
      state.performance = {
        cacheHitRate: 0,
        averageQueryTime: 0,
        activeQueries: 0,
        totalCacheSize: 0,
        lastReset: Date.now(),
      };
    },
    
    // Connection status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.connectionStatus.online = action.payload;
      if (action.payload) {
        state.connectionStatus.lastOnline = Date.now();
      }
    },
    
    // Notifications
    updateNotificationCount: (state, action: PayloadAction<number>) => {
      state.notifications.unreadCount = action.payload;
    },
    
    markNotificationsAsRead: (state) => {
      state.notifications.unreadCount = 0;
      state.notifications.lastChecked = Date.now();
    },
  },
});

// Export actions
export const {
  setFeatureFlag,
  updateSettings,
  setTheme,
  toggleDebugMode,
  updatePerformanceMetrics,
  resetPerformanceMetrics,
  setOnlineStatus,
  updateNotificationCount,
  markNotificationsAsRead,
} = appSlice.actions;

// Export reducer
export default appSlice.reducer;

// Selectors
export const selectFeatureFlags = (state: { app: AppState }) => state.app.featureFlags;
export const selectAppSettings = (state: { app: AppState }) => state.app.settings;
export const selectPerformanceMetrics = (state: { app: AppState }) => state.app.performance;
export const selectConnectionStatus = (state: { app: AppState }) => state.app.connectionStatus;
export const selectNotifications = (state: { app: AppState }) => state.app.notifications;

// Feature flag selectors
export const selectUseReduxForNostr = (state: { app: AppState }) => state.app.featureFlags.useReduxForNostr;
export const selectUseReduxForWallet = (state: { app: AppState }) => state.app.featureFlags.useReduxForWallet;
export const selectUseReduxForProfiles = (state: { app: AppState }) => state.app.featureFlags.useReduxForProfiles;
export const selectUseReduxForUI = (state: { app: AppState }) => state.app.featureFlags.useReduxForUI;
export const selectUseReduxForLocalStorage = (state: { app: AppState }) => state.app.featureFlags.useReduxForLocalStorage;
export const selectUseReduxForNotebin = (state: { app: AppState }) => state.app.featureFlags.useReduxForNotebin;
export const selectUseReduxForWalletPreferences = (state: { app: AppState }) => state.app.featureFlags.useReduxForWalletPreferences;
export const selectUseReduxForThemePreferences = (state: { app: AppState }) => state.app.featureFlags.useReduxForThemePreferences;
export const selectUseRTKQueryForProfiles = (state: { app: AppState }) => state.app.featureFlags.useRTKQueryForProfiles;
export const selectUseRTKQueryForEvents = (state: { app: AppState }) => state.app.featureFlags.useRTKQueryForEvents;

// Settings selectors
export const selectTheme = (state: { app: AppState }) => state.app.settings.theme;
export const selectDebugMode = (state: { app: AppState }) => state.app.settings.debugMode; 

