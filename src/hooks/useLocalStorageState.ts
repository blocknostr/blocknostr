import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import {
  SavedNote,
  WalletPreference,
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
  selectNotebinNotes,
  selectNotebinView,
  selectNotebinSortOption,
  selectWalletPreferences,
  selectSelectedWallet,
  selectSelectedWalletType,
  selectThemePreferences,
  selectCacheInfo
} from '../store/slices/localStorageSlice';

/**
 * Hook for Notebin state and actions
 */
export const useNotebinState = () => {
  const dispatch = useAppDispatch();
  const notes = useAppSelector(selectNotebinNotes);
  const view = useAppSelector(selectNotebinView);
  const sortOption = useAppSelector(selectNotebinSortOption);
  
  const setSavedNotesAction = useCallback((notes: SavedNote[]) => {
    dispatch(setSavedNotes(notes));
  }, [dispatch]);
  
  const addNote = useCallback((note: SavedNote) => {
    dispatch(addSavedNote(note));
  }, [dispatch]);
  
  const updateNote = useCallback((id: string, updates: Partial<SavedNote>) => {
    dispatch(updateSavedNote({ id, updates }));
  }, [dispatch]);
  
  const deleteNote = useCallback((id: string) => {
    dispatch(deleteSavedNote(id));
  }, [dispatch]);
  
  const setView = useCallback((newView: 'grid' | 'list') => {
    dispatch(setNotebinView(newView));
  }, [dispatch]);
  
  const setSortOption = useCallback((newSortOption: 'newest' | 'oldest' | 'updated' | 'alphabetical') => {
    dispatch(setNotebinSortOption(newSortOption));
  }, [dispatch]);
  
  return {
    notes,
    view,
    sortOption,
    setSavedNotes: setSavedNotesAction,
    addNote,
    updateNote,
    deleteNote,
    setView,
    setSortOption
  };
};

/**
 * Hook for Wallet preferences
 */
export const useWalletPreferences = () => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectWalletPreferences);
  const selectedWallet = useAppSelector(selectSelectedWallet);
  const selectedWalletType = useAppSelector(selectSelectedWalletType);
  
  const setWalletAddress = useCallback((address: string) => {
    dispatch(setSelectedWallet(address));
  }, [dispatch]);
  
  const setWalletType = useCallback((type: string) => {
    dispatch(setSelectedWalletType(type));
  }, [dispatch]);
  
  const updatePreferences = useCallback((updates: Partial<WalletPreference>) => {
    dispatch(updateWalletPreferences(updates));
  }, [dispatch]);
  
  return {
    preferences,
    selectedWallet,
    selectedWalletType,
    setWalletAddress,
    setWalletType,
    updatePreferences
  };
};

/**
 * Hook for Theme preferences
 */
export const useThemePreferences = () => {
  const dispatch = useAppDispatch();
  const themePreferences = useAppSelector(selectThemePreferences);
  
  const setDarkModePreference = useCallback((isDark: boolean) => {
    dispatch(setDarkMode(isDark));
  }, [dispatch]);
  
  const setColorSchemePreference = useCallback((scheme: 'default' | 'blue' | 'green' | 'purple') => {
    dispatch(setColorScheme(scheme));
  }, [dispatch]);
  
  return {
    ...themePreferences,
    setDarkMode: setDarkModePreference,
    setColorScheme: setColorSchemePreference
  };
};

/**
 * Hook for Cache management
 */
export const useCacheManagement = () => {
  const dispatch = useAppDispatch();
  const cacheInfo = useAppSelector(selectCacheInfo);
  
  const clearCacheAction = useCallback(() => {
    dispatch(clearCache());
  }, [dispatch]);
  
  const updateSize = useCallback((size: number) => {
    dispatch(updateCacheSize(size));
  }, [dispatch]);
  
  return {
    ...cacheInfo,
    clearCache: clearCacheAction,
    updateCacheSize: updateSize
  };
};

/**
 * Unified LocalStorage state hook
 */
export const useLocalStorageState = () => {
  const notebin = useNotebinState();
  const wallet = useWalletPreferences();
  const theme = useThemePreferences();
  const cache = useCacheManagement();
  
  return {
    notebin,
    wallet,
    theme,
    cache
  };
};

export default useLocalStorageState; 
