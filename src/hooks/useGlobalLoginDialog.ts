import { useState, useEffect } from 'react';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

// Global state for login dialog
let globalLoginDialogOpen = false;
let setGlobalLoginDialogOpenCallbacks: Set<(open: boolean) => void> = new Set();

/**
 * Global login dialog hook to prevent multiple dialogs from opening
 * and ensure consistent login dialog state across the app
 */
export function useGlobalLoginDialog() {
  const [isOpen, setIsOpen] = useState(globalLoginDialogOpen);

  useEffect(() => {
    // Register this hook's setter
    setGlobalLoginDialogOpenCallbacks.add(setIsOpen);

    // Listen for auth changes to close dialog on successful login
    const handleAuthChange = (authData: { isLoggedIn: boolean; publicKey: string | null }) => {
      if (authData.isLoggedIn) {
        // Close dialog when user logs in
        updateGlobalLoginDialogState(false);
      }
    };

    eventBus.on(EVENTS.AUTH_CHANGED, handleAuthChange);

    return () => {
      setGlobalLoginDialogOpenCallbacks.delete(setIsOpen);
      eventBus.off(EVENTS.AUTH_CHANGED, handleAuthChange);
    };
  }, []);

  const openLoginDialog = () => {
    updateGlobalLoginDialogState(true);
  };

  const closeLoginDialog = () => {
    updateGlobalLoginDialogState(false);
  };

  const setLoginDialogOpen = (open: boolean) => {
    updateGlobalLoginDialogState(open);
  };

  return {
    isOpen,
    openLoginDialog,
    closeLoginDialog,
    setLoginDialogOpen
  };
}

// Helper function to update global state and notify all hooks
function updateGlobalLoginDialogState(open: boolean) {
  globalLoginDialogOpen = open;
  setGlobalLoginDialogOpenCallbacks.forEach(callback => callback(open));
} 

