import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface ChatPreferences {
  defaultChannel: string;
  notifications: boolean;
  soundEnabled: boolean;
  autoScroll: boolean;
  showTimestamps: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface ConnectionStatus {
  isConnected: boolean;
  connectedRelays: number;
  totalRelays: number;
  lastChecked: number;
  isChecking: boolean;
}

// ✅ NEW: Complete WorldChat state management
interface ChannelState {
  isLoadingMore: boolean;
  hasMoreHistory: boolean;
  oldestEventTimestamp?: number;
  lastMessageTimestamp?: number;
  messageCount: number;
  scrollPosition: number;
  isAtBottom: boolean;
}

interface ChatState {
  preferences: ChatPreferences;
  currentChannel: string;
  isConnected: boolean;
  lastActivity: number;
  messageDrafts: Record<string, string>; // channel -> draft message
  pinnedMessages: string[]; // message IDs
  mutedUsers: string[]; // pubkeys
  
  // ✅ ADDED: Centralized connection management
  connectionStatus: ConnectionStatus;
  
  // ✅ NEW: Channel-specific state management
  channels: Record<string, ChannelState>;
  
  // ✅ NEW: Unified activity tracking
  unreadCounts: Record<string, number>; // channel -> unread count
  lastReadTimestamps: Record<string, number>; // channel -> timestamp
  
  // ✅ NEW: UI state management
  isMinimized: boolean;
  showScrollToBottom: boolean;
  
  // ✅ NEW: Error handling
  errors: Record<string, string>; // operation -> error message
  
  // ✅ NEW: 100% Redux - Complete WorldChat state
  currentChatTag: string; // Current active chat channel
  isChangingChannel: boolean; // Channel switching state
}

// ✅ FIXED: Ensure proper default connection status
const defaultConnectionStatus: ConnectionStatus = {
  isConnected: false,
  connectedRelays: 0,
  totalRelays: 0,
  lastChecked: 0,
  isChecking: false,
};

// ✅ NEW: Default channel state
const defaultChannelState: ChannelState = {
  isLoadingMore: false,
  hasMoreHistory: true,
  messageCount: 0,
  scrollPosition: 0,
  isAtBottom: true,
};

const initialState: ChatState = {
  preferences: {
    defaultChannel: 'world-chat',
    notifications: true,
    soundEnabled: false,
    autoScroll: true,
    showTimestamps: true,
    compactMode: false,
    theme: 'auto',
  },
  currentChannel: 'world-chat',
  isConnected: false,
  lastActivity: Date.now(),
  messageDrafts: {},
  pinnedMessages: [],
  mutedUsers: [],
  
  // ✅ FIXED: Use default connection status
  connectionStatus: defaultConnectionStatus,
  
  // ✅ NEW: Complete state management
  channels: {
    'world-chat': { ...defaultChannelState }
  },
  unreadCounts: {},
  lastReadTimestamps: {},
  isMinimized: false,
  showScrollToBottom: false,
  errors: {},
  
  // ✅ NEW: 100% Redux - Complete WorldChat state
  currentChatTag: 'world-chat',
  isChangingChannel: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Preferences
    updatePreferences: (state, action: PayloadAction<Partial<ChatPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    
    setDefaultChannel: (state, action: PayloadAction<string>) => {
      state.preferences.defaultChannel = action.payload;
    },
    
    toggleNotifications: (state) => {
      state.preferences.notifications = !state.preferences.notifications;
    },
    
    toggleSound: (state) => {
      state.preferences.soundEnabled = !state.preferences.soundEnabled;
    },
    
    toggleAutoScroll: (state) => {
      state.preferences.autoScroll = !state.preferences.autoScroll;
    },
    
    toggleCompactMode: (state) => {
      state.preferences.compactMode = !state.preferences.compactMode;
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.preferences.theme = action.payload;
    },
    
    // Channel management
    setCurrentChannel: (state, action: PayloadAction<string>) => {
      const channel = action.payload;
      state.currentChannel = channel;
      state.lastActivity = Date.now();
      
      // ✅ NEW: Initialize channel state if not exists
      if (!state.channels[channel]) {
        state.channels[channel] = { ...defaultChannelState };
      }
      
      // ✅ NEW: Reset unread count when switching to channel
      state.unreadCounts[channel] = 0;
      state.lastReadTimestamps[channel] = Date.now() / 1000;
    },
    
    // ✅ FIXED: Connection status with proper error handling
    updateConnectionStatus: (state, action: PayloadAction<{
      isConnected: boolean;
      connectedRelays: number;
      totalRelays: number;
    }>) => {
      const { isConnected, connectedRelays, totalRelays } = action.payload;
      
      // ✅ FIXED: Ensure connectionStatus exists before updating
      if (!state.connectionStatus) {
        state.connectionStatus = { ...defaultConnectionStatus };
      }
      
      state.connectionStatus.isConnected = isConnected;
      state.connectionStatus.connectedRelays = connectedRelays;
      state.connectionStatus.totalRelays = totalRelays;
      state.connectionStatus.lastChecked = Date.now();
      state.connectionStatus.isChecking = false;
      
      state.isConnected = isConnected;
      if (isConnected) {
        state.lastActivity = Date.now();
        // ✅ FIXED: Ensure errors exists before accessing
        if (!state.errors) {
          state.errors = {};
        }
        delete state.errors.connection; // Clear connection errors
      }
    },
    
    setConnectionChecking: (state, action: PayloadAction<boolean>) => {
      // ✅ FIXED: Ensure connectionStatus exists before updating
      if (!state.connectionStatus) {
        state.connectionStatus = { ...defaultConnectionStatus };
      }
      state.connectionStatus.isChecking = action.payload;
    },

    // ✅ NEW: Complete history loading state management
    setLoadingMore: (state, action: PayloadAction<{ channel: string; loading: boolean }>) => {
      const { channel, loading } = action.payload;
      // ✅ FIXED: Ensure channels exists before accessing
      if (!state.channels) {
        state.channels = {};
      }
      if (!state.channels[channel]) {
        state.channels[channel] = { ...defaultChannelState };
      }
      state.channels[channel].isLoadingMore = loading;
    },
    
    setHasMoreHistory: (state, action: PayloadAction<{ channel: string; hasMore: boolean }>) => {
      const { channel, hasMore } = action.payload;
      // ✅ FIXED: Ensure channels exists before accessing
      if (!state.channels) {
        state.channels = {};
      }
      if (!state.channels[channel]) {
        state.channels[channel] = { ...defaultChannelState };
      }
      state.channels[channel].hasMoreHistory = hasMore;
    },
    
    updateChannelTimestamps: (state, action: PayloadAction<{
      channel: string;
      oldestEventTimestamp?: number;
      lastMessageTimestamp?: number;
      messageCount?: number;
    }>) => {
      const { channel, oldestEventTimestamp, lastMessageTimestamp, messageCount } = action.payload;
      // ✅ FIXED: Ensure channels exists before accessing
      if (!state.channels) {
        state.channels = {};
      }
      if (!state.channels[channel]) {
        state.channels[channel] = { ...defaultChannelState };
      }
      
      const channelState = state.channels[channel];
      if (oldestEventTimestamp !== undefined) {
        channelState.oldestEventTimestamp = oldestEventTimestamp;
      }
      if (lastMessageTimestamp !== undefined) {
        channelState.lastMessageTimestamp = lastMessageTimestamp;
      }
      if (messageCount !== undefined) {
        channelState.messageCount = messageCount;
      }
    },

    // ✅ NEW: UI state management
    setMinimized: (state, action: PayloadAction<boolean>) => {
      state.isMinimized = action.payload;
      if (!action.payload) {
        // When expanding, reset unread for current channel
        // ✅ FIXED: Ensure unreadCounts exists before accessing
        if (!state.unreadCounts) {
          state.unreadCounts = {};
        }
        if (!state.lastReadTimestamps) {
          state.lastReadTimestamps = {};
        }
        state.unreadCounts[state.currentChannel] = 0;
        state.lastReadTimestamps[state.currentChannel] = Date.now() / 1000;
      }
    },
    
    setShowScrollToBottom: (state, action: PayloadAction<boolean>) => {
      state.showScrollToBottom = action.payload;
    },
    
    updateScrollPosition: (state, action: PayloadAction<{ channel: string; position: number; isAtBottom: boolean }>) => {
      const { channel, position, isAtBottom } = action.payload;
      // ✅ FIXED: Ensure channels exists before accessing
      if (!state.channels) {
        state.channels = {};
      }
      if (!state.channels[channel]) {
        state.channels[channel] = { ...defaultChannelState };
      }
      state.channels[channel].scrollPosition = position;
      state.channels[channel].isAtBottom = isAtBottom;
    },

    // ✅ NEW: Unread message management
    incrementUnreadCount: (state, action: PayloadAction<string | { channel: string; count: number }>) => {
      // ✅ CRITICAL FIX: Support both single and batch unread count updates
      let channel: string;
      let count: number = 1;
      
      if (typeof action.payload === 'string') {
        // Legacy single increment
        channel = action.payload;
      } else {
        // ✅ NEW: Batch increment support
        channel = action.payload.channel;
        count = action.payload.count;
      }
      
      if (state.isMinimized || channel !== state.currentChannel) {
        // ✅ FIXED: Ensure unreadCounts exists before accessing
        if (!state.unreadCounts) {
          state.unreadCounts = {};
        }
        state.unreadCounts[channel] = (state.unreadCounts[channel] || 0) + count;
      }
    },
    
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const channel = action.payload;
      // ✅ FIXED: Ensure unreadCounts and lastReadTimestamps exist before accessing
      if (!state.unreadCounts) {
        state.unreadCounts = {};
      }
      if (!state.lastReadTimestamps) {
        state.lastReadTimestamps = {};
      }
      state.unreadCounts[channel] = 0;
      state.lastReadTimestamps[channel] = Date.now() / 1000;
    },

    // ✅ NEW: Error handling
    setError: (state, action: PayloadAction<{ operation: string; error: string | null }>) => {
      const { operation, error } = action.payload;
      // ✅ FIXED: Ensure errors exists before accessing
      if (!state.errors) {
        state.errors = {};
      }
      if (error) {
        state.errors[operation] = error;
      } else {
        delete state.errors[operation];
      }
    },
    
    clearAllErrors: (state) => {
      state.errors = {};
    },
    
    // Message drafts
    saveDraft: (state, action: PayloadAction<{ channel: string; content: string }>) => {
      const { channel, content } = action.payload;
      if (content.trim()) {
        state.messageDrafts[channel] = content;
      } else {
        delete state.messageDrafts[channel];
      }
    },
    
    clearDraft: (state, action: PayloadAction<string>) => {
      delete state.messageDrafts[action.payload];
    },
    
    // Pinned messages
    pinMessage: (state, action: PayloadAction<string>) => {
      if (!state.pinnedMessages.includes(action.payload)) {
        state.pinnedMessages.push(action.payload);
      }
    },
    
    unpinMessage: (state, action: PayloadAction<string>) => {
      state.pinnedMessages = state.pinnedMessages.filter(id => id !== action.payload);
    },
    
    // Muted users
    muteUser: (state, action: PayloadAction<string>) => {
      if (!state.mutedUsers.includes(action.payload)) {
        state.mutedUsers.push(action.payload);
      }
    },
    
    unmuteUser: (state, action: PayloadAction<string>) => {
      state.mutedUsers = state.mutedUsers.filter(pubkey => pubkey !== action.payload);
    },
    
    // Activity tracking
    updateActivity: (state) => {
      state.lastActivity = Date.now();
    },
    
    // Reset state
    resetChat: (state) => {
      return { ...initialState, preferences: state.preferences }; // Keep preferences
    },
    
    // ✅ NEW: 100% Redux - Complete WorldChat state management
    setCurrentChatTag: (state, action: PayloadAction<string>) => {
      const newTag = action.payload;
      if (state.currentChatTag !== newTag) {
        state.currentChatTag = newTag;
        state.isChangingChannel = false; // Reset when tag actually changes
        
        // Initialize channel state if not exists
        if (!state.channels) {
          state.channels = {};
        }
        if (!state.channels[newTag]) {
          state.channels[newTag] = { ...defaultChannelState };
        }
        
        // Reset unread count for new channel
        if (!state.unreadCounts) {
          state.unreadCounts = {};
        }
        state.unreadCounts[newTag] = 0;
        
        // Update last read timestamp
        if (!state.lastReadTimestamps) {
          state.lastReadTimestamps = {};
        }
        state.lastReadTimestamps[newTag] = Date.now() / 1000;
      }
    },
    
    setIsChangingChannel: (state, action: PayloadAction<boolean>) => {
      state.isChangingChannel = action.payload;
    },
  },
});

// Actions
export const {
  updatePreferences,
  setDefaultChannel,
  toggleNotifications,
  toggleSound,
  toggleAutoScroll,
  toggleCompactMode,
  setTheme,
  setCurrentChannel,
  updateConnectionStatus,
  setConnectionChecking,
  setLoadingMore,
  setHasMoreHistory,
  updateChannelTimestamps,
  setMinimized,
  setShowScrollToBottom,
  updateScrollPosition,
  incrementUnreadCount,
  resetUnreadCount,
  setError,
  clearAllErrors,
  saveDraft,
  clearDraft,
  pinMessage,
  unpinMessage,
  muteUser,
  unmuteUser,
  updateActivity,
  resetChat,
  setCurrentChatTag,
  setIsChangingChannel,
} = chatSlice.actions;

export default chatSlice.reducer;

// ✅ ENHANCED: Comprehensive selectors
export const selectChatPreferences = (state: RootState) => state.chat.preferences;
export const selectCurrentChannel = (state: RootState) => state.chat.currentChannel;
export const selectIsConnected = (state: RootState) => state.chat.isConnected;
export const selectLastActivity = (state: RootState) => state.chat.lastActivity;
export const selectMessageDrafts = (state: RootState) => state.chat.messageDrafts;
export const selectDraftForChannel = (state: RootState, channel: string) => 
  state.chat.messageDrafts[channel] || '';

export const selectPinnedMessages = (state: RootState) => state.chat.pinnedMessages;
export const selectMutedUsers = (state: RootState) => state.chat.mutedUsers;
export const selectIsUserMuted = (state: RootState, pubkey: string) => 
  state.chat.mutedUsers.includes(pubkey);

// ✅ NEW: Channel-specific selectors
export const selectChannelState = (state: RootState, channel: string) => 
  state.chat?.channels?.[channel] || defaultChannelState;

export const selectIsLoadingMore = (state: RootState, channel: string) => 
  state.chat?.channels?.[channel]?.isLoadingMore || false;

export const selectHasMoreHistory = (state: RootState, channel: string) => 
  state.chat?.channels?.[channel]?.hasMoreHistory ?? true;

// ✅ NEW: UI state selectors
export const selectIsMinimized = (state: RootState) => state.chat?.isMinimized ?? false;
export const selectShowScrollToBottom = (state: RootState) => state.chat?.showScrollToBottom ?? false;

export const selectUnreadCount = (state: RootState, channel: string) => 
  state.chat?.unreadCounts?.[channel] || 0;

export const selectTotalUnreadCount = (state: RootState) => {
  const unreadCounts = state.chat?.unreadCounts;
  if (!unreadCounts) return 0;
  return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
};

// ✅ NEW: Error selectors
export const selectChatErrors = (state: RootState) => state.chat?.errors || {};
export const selectChatError = (state: RootState, operation: string) => 
  state.chat?.errors?.[operation] || null;

export const selectChatSettings = (state: RootState) => ({
  preferences: state.chat.preferences,
  currentChannel: state.chat.currentChannel,
  isConnected: state.chat.isConnected,
});

export const selectChatState = (state: RootState) => state.chat;

export const selectConnectionStatus = (state: RootState) => state.chat?.connectionStatus;

export const selectConnectionStatusSafe = (state: RootState) => {
  const status = state.chat?.connectionStatus;
  return status || defaultConnectionStatus;
};

export const selectConnectedRelayCount = (state: RootState) => 
  state.chat?.connectionStatus?.connectedRelays || 0;

export const selectTotalRelayCount = (state: RootState) => 
  state.chat?.connectionStatus?.totalRelays || 0;

// ✅ NEW: 100% Redux - Complete WorldChat selectors
export const selectCurrentChatTag = (state: RootState) => state.chat?.currentChatTag || 'world-chat';
export const selectIsChangingChannel = (state: RootState) => state.chat?.isChangingChannel ?? false; 
