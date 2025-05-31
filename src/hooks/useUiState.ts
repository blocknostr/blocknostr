import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import {
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
  selectNavigationState,
  selectSidebarState,
  selectActiveModals,
  selectPreferences,
  selectToasts
} from '../store/slices/uiSlice';

/**
 * Hook for Navigation state and actions
 */
export const useNavigation = () => {
  const dispatch = useAppDispatch();
  const { history, canGoBack } = useAppSelector(selectNavigationState);
  
  const goBack = useCallback(() => {
    if (canGoBack) {
      dispatch(popHistory());
    }
  }, [canGoBack, dispatch]);
  
  const addToHistory = useCallback((path: string) => {
    dispatch(pushToHistory(path));
  }, [dispatch]);
  
  return {
    history,
    canGoBack,
    goBack,
    addToHistory
  };
};

/**
 * Hook for Sidebar state and actions
 */
export const useSidebar = () => {
  const dispatch = useAppDispatch();
  const { open, openMobile } = useAppSelector(selectSidebarState);
  
  const setOpen = useCallback((isOpen: boolean) => {
    dispatch(setSidebarOpen(isOpen));
  }, [dispatch]);
  
  const setOpenMobile = useCallback((isOpen: boolean) => {
    dispatch(setSidebarMobileOpen(isOpen));
  }, [dispatch]);
  
  const toggle = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);
  
  return {
    open,
    openMobile,
    setOpen,
    setOpenMobile,
    toggle
  };
};

/**
 * Hook for Modal state and actions
 */
export const useModal = () => {
  const dispatch = useAppDispatch();
  const activeModals = useAppSelector(selectActiveModals);
  
  const openModalById = useCallback((modalId: string) => {
    dispatch(openModal(modalId));
  }, [dispatch]);
  
  const closeModalById = useCallback((modalId: string) => {
    dispatch(closeModal(modalId));
  }, [dispatch]);
  
  const closeAll = useCallback(() => {
    dispatch(closeAllModals());
  }, [dispatch]);
  
  const isModalOpen = useCallback((modalId: string) => {
    return activeModals.includes(modalId);
  }, [activeModals]);
  
  return {
    activeModals,
    openModal: openModalById,
    closeModal: closeModalById,
    closeAllModals: closeAll,
    isModalOpen
  };
};

/**
 * Hook for UI Preferences
 */
export const usePreferences = () => {
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectPreferences);
  
  const setView = useCallback((view: 'grid' | 'list') => {
    dispatch(setNotebinView(view));
  }, [dispatch]);
  
  const setIsDarkMode = useCallback((isDark: boolean) => {
    dispatch(setDarkMode(isDark));
  }, [dispatch]);
  
  const setIsCompactMode = useCallback((isCompact: boolean) => {
    dispatch(setCompactMode(isCompact));
  }, [dispatch]);
  
  return {
    ...preferences,
    setNotebinView: setView,
    setDarkMode: setIsDarkMode,
    setCompactMode: setIsCompactMode
  };
};

/**
 * Hook for Toast notifications
 */
export const useToasts = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectToasts);
  
  const showToast = useCallback((toast: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timeout?: number;
  }) => {
    dispatch(addToast(toast));
  }, [dispatch]);
  
  const hideToast = useCallback((id: string) => {
    dispatch(removeToast(id));
  }, [dispatch]);
  
  const clearAll = useCallback(() => {
    dispatch(clearToasts());
  }, [dispatch]);
  
  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts: clearAll
  };
};

/**
 * Unified UI state hook
 */
export const useUiState = () => {
  const navigation = useNavigation();
  const sidebar = useSidebar();
  const modal = useModal();
  const preferences = usePreferences();
  const toasts = useToasts();
  
  return {
    navigation,
    sidebar,
    modal,
    preferences,
    toasts
  };
};

export default useUiState; 
