import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Types for responsive state
export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';

// UI state interface
interface UiState {
  // Navigation state
  navigation: {
    history: string[];
    canGoBack: boolean;
  };
  
  // Sidebar state
  sidebar: {
    open: boolean;
    openMobile: boolean;
  };
  
  // Modal state
  modals: {
    activeModals: string[];
  };
  
  // View preferences
  preferences: {
    notebinView: 'grid' | 'list';
    darkMode: boolean;
    compactMode: boolean;
  };
  
  // Toast notifications queue
  toasts: {
    queue: Array<{
      id: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      timeout: number;
    }>;
  };
  
  // Responsive state - lightweight tracking
  responsive: {
    breakpoint: Breakpoint;
    dimensions: {
      width: number;
      height: number;
    };
    isTouch: boolean;
    layoutMode: 'single' | 'dual' | 'triple'; // Feed layout optimization
  };
}

// Initial state with safe defaults
const initialState: UiState = {
  navigation: {
    history: [],
    canGoBack: false,
  },
  sidebar: {
    open: true,
    openMobile: false,
  },
  modals: {
    activeModals: [],
  },
  preferences: {
    notebinView: 'grid',
    darkMode: false,
    compactMode: false,
  },
  toasts: {
    queue: [],
  },
  responsive: {
    breakpoint: 'desktop', // Default to desktop (1920×1080 primary target)
    dimensions: {
      width: 1920,
      height: 1080,
    },
    isTouch: false,
    layoutMode: 'triple',
  },
};

// UI slice
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Navigation actions
    pushToHistory: (state, action: PayloadAction<string>) => {
      // Don't add duplicate entries for the same path
      if (state.navigation.history.length === 0 || 
          state.navigation.history[state.navigation.history.length - 1] !== action.payload) {
        state.navigation.history.push(action.payload);
        state.navigation.canGoBack = state.navigation.history.length > 1;
      }
    },
    
    popHistory: (state) => {
      if (state.navigation.history.length > 1) {
        state.navigation.history.pop();
        state.navigation.canGoBack = state.navigation.history.length > 1;
      }
    },
    
    // Sidebar actions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.open = action.payload;
    },
    
    setSidebarMobileOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.openMobile = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebar.open = !state.sidebar.open;
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<string>) => {
      if (!state.modals.activeModals.includes(action.payload)) {
        state.modals.activeModals.push(action.payload);
      }
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      state.modals.activeModals = state.modals.activeModals.filter(
        modalId => modalId !== action.payload
      );
    },
    
    closeAllModals: (state) => {
      state.modals.activeModals = [];
    },
    
    // Preference actions
    setNotebinView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.preferences.notebinView = action.payload;
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.preferences.darkMode = action.payload;
    },
    
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.preferences.compactMode = action.payload;
    },
    
    // Toast actions
    addToast: (state, action: PayloadAction<{
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      timeout?: number;
    }>) => {
      const { message, type, timeout = 5000 } = action.payload;
      state.toasts.queue.push({
        id: `toast-${Date.now()}-${state.toasts.queue.length}`,
        message,
        type,
        timeout,
      });
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts.queue = state.toasts.queue.filter(
        toast => toast.id !== action.payload
      );
    },
    
    clearToasts: (state) => {
      state.toasts.queue = [];
    },
    
    // Responsive actions - lightweight state updates
    updateResponsiveState: (state, action: PayloadAction<{
      breakpoint: Breakpoint;
      dimensions: { width: number; height: number };
      isTouch: boolean;
    }>) => {
      const { breakpoint, dimensions, isTouch } = action.payload;
      state.responsive.breakpoint = breakpoint;
      state.responsive.dimensions = dimensions;
      state.responsive.isTouch = isTouch;
      
      // Update layout mode based on breakpoint
      switch (breakpoint) {
        case 'mobile':
          state.responsive.layoutMode = 'single';
          break;
        case 'tablet':
          state.responsive.layoutMode = 'dual';
          break;
        case 'laptop':
          state.responsive.layoutMode = 'dual';
          break;
        case 'desktop':
          state.responsive.layoutMode = 'triple';
          break;
        default:
          state.responsive.layoutMode = 'triple';
      }
    },
  },
});

// Action creators
export const {
  pushToHistory,
  popHistory,
  setSidebarOpen,
  setSidebarMobileOpen,
  toggleSidebar,
  openModal,
  closeModal,
  closeAllModals,
  setNotebinView,
  setDarkMode,
  setCompactMode,
  addToast,
  removeToast,
  clearToasts,
  updateResponsiveState,
} = uiSlice.actions;

// Selectors
export const selectNavigationState = (state: RootState) => state.ui.navigation;
export const selectSidebarState = (state: RootState) => state.ui.sidebar;
export const selectActiveModals = (state: RootState) => state.ui.modals.activeModals;
export const selectPreferences = (state: RootState) => state.ui.preferences;
export const selectToasts = (state: RootState) => state.ui.toasts.queue;

// Enhanced responsive selectors
export const selectResponsiveState = (state: RootState) => state.ui.responsive;
export const selectCurrentBreakpoint = (state: RootState) => state.ui.responsive.breakpoint;
export const selectLayoutMode = (state: RootState) => state.ui.responsive.layoutMode;
export const selectIsTouch = (state: RootState) => state.ui.responsive.isTouch;

export default uiSlice.reducer; 
