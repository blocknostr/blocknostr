import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Types for local storage data
export interface SavedNote {
  id: string;
  title: string;
  content: string;
  language: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  authorId?: string;
}

export interface WalletPreference {
  selectedWallet: string;
  selectedWalletType: string;
  showTestNetworks: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  hideSmallBalances: boolean;
}

// LocalStorage state interface
interface LocalStorageState {
  // Notebin state
  notebin: {
    savedNotes: SavedNote[];
    view: 'grid' | 'list';
    sortOption: 'newest' | 'oldest' | 'updated' | 'alphabetical';
  };
  
  // Wallet preferences
  wallet: WalletPreference;
  
  // Theme preferences
  theme: {
    darkMode: boolean;
    colorScheme: 'default' | 'blue' | 'green' | 'purple';
  };
  
  // Cache information
  cache: {
    lastCleared: number | null;
    size: number;
  };
}

// Initial state with default values
const initialState: LocalStorageState = {
  notebin: {
    savedNotes: [],
    view: 'grid',
    sortOption: 'newest',
  },
  wallet: {
    selectedWallet: '',
    selectedWalletType: 'Alephium',
    showTestNetworks: false,
    autoRefresh: true,
    refreshInterval: 60000,
    hideSmallBalances: false,
  },
  theme: {
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    colorScheme: 'default',
  },
  cache: {
    lastCleared: null,
    size: 0,
  },
};

// Create the slice
export const localStorageSlice = createSlice({
  name: 'localStorage',
  initialState,
  reducers: {
    // Notebin actions
    setSavedNotes: (state, action: PayloadAction<SavedNote[]>) => {
      state.notebin.savedNotes = action.payload;
    },
    
    addSavedNote: (state, action: PayloadAction<SavedNote>) => {
      // Don't add if already exists
      if (!state.notebin.savedNotes.some(note => note.id === action.payload.id)) {
        state.notebin.savedNotes.push(action.payload);
      }
    },
    
    updateSavedNote: (state, action: PayloadAction<{id: string, updates: Partial<SavedNote>}>) => {
      const { id, updates } = action.payload;
      const noteIndex = state.notebin.savedNotes.findIndex(note => note.id === id);
      
      if (noteIndex !== -1) {
        state.notebin.savedNotes[noteIndex] = {
          ...state.notebin.savedNotes[noteIndex],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },
    
    deleteSavedNote: (state, action: PayloadAction<string>) => {
      state.notebin.savedNotes = state.notebin.savedNotes.filter(
        note => note.id !== action.payload
      );
    },
    
    setNotebinView: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.notebin.view = action.payload;
    },
    
    setNotebinSortOption: (state, action: PayloadAction<'newest' | 'oldest' | 'updated' | 'alphabetical'>) => {
      state.notebin.sortOption = action.payload;
    },
    
    // Wallet actions
    setSelectedWallet: (state, action: PayloadAction<string>) => {
      state.wallet.selectedWallet = action.payload;
    },
    
    setSelectedWalletType: (state, action: PayloadAction<string>) => {
      state.wallet.selectedWalletType = action.payload;
    },
    
    updateWalletPreferences: (state, action: PayloadAction<Partial<WalletPreference>>) => {
      state.wallet = {
        ...state.wallet,
        ...action.payload,
      };
    },
    
    // Theme actions
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.theme.darkMode = action.payload;
    },
    
    setColorScheme: (state, action: PayloadAction<'default' | 'blue' | 'green' | 'purple'>) => {
      state.theme.colorScheme = action.payload;
    },
    
    // Cache actions
    clearCache: (state) => {
      state.cache.lastCleared = Date.now();
      state.cache.size = 0;
    },
    
    updateCacheSize: (state, action: PayloadAction<number>) => {
      state.cache.size = action.payload;
    },
  },
});

// Export actions
export const {
  setSavedNotes,
  addSavedNote,
  updateSavedNote,
  deleteSavedNote,
  setNotebinView,
  setNotebinSortOption,
  setSelectedWallet,
  setSelectedWalletType,
  updateWalletPreferences,
  setDarkMode,
  setColorScheme,
  clearCache,
  updateCacheSize,
} = localStorageSlice.actions;

// Selectors
export const selectNotebinNotes = (state: RootState) => state.localStorage.notebin.savedNotes;
export const selectNotebinView = (state: RootState) => state.localStorage.notebin.view;
export const selectNotebinSortOption = (state: RootState) => state.localStorage.notebin.sortOption;
export const selectWalletPreferences = (state: RootState) => state.localStorage.wallet;
export const selectSelectedWallet = (state: RootState) => state.localStorage.wallet.selectedWallet;
export const selectSelectedWalletType = (state: RootState) => state.localStorage.wallet.selectedWalletType;
export const selectThemePreferences = (state: RootState) => state.localStorage.theme;
export const selectCacheInfo = (state: RootState) => state.localStorage.cache;

export default localStorageSlice.reducer; 
