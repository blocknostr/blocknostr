
import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

/**
 * Hook to manage Nostr authentication state and provide login-related functionality
 */
export function useNostrAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!nostrService.publicKey);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const [currentUserPubkey, setCurrentUserPubkey] = useState<string | null>(nostrService.publicKey);

  // Initialize auth state and listen for auth events
  useEffect(() => {
    const checkLoginStatus = () => {
      const pubkey = nostrService.publicKey;
      setIsLoggedIn(!!pubkey);
      setCurrentUserPubkey(pubkey);
      setIsAuthInitialized(true);
    };

    // Check initial login status
    checkLoginStatus();

    // Listen for login/logout events
    const handleLogin = (pubkey: string) => {
      setIsLoggedIn(true);
      setCurrentUserPubkey(pubkey);
    };

    const handleLogout = () => {
      setIsLoggedIn(false);
      setCurrentUserPubkey(null);
    };

    eventBus.on(EVENTS.USER_LOGGED_IN, handleLogin);
    eventBus.on(EVENTS.USER_LOGGED_OUT, handleLogout);

    return () => {
      eventBus.off(EVENTS.USER_LOGGED_IN, handleLogin);
      eventBus.off(EVENTS.USER_LOGGED_OUT, handleLogout);
    };
  }, []);

  const login = async (): Promise<boolean> => {
    try {
      const success = await nostrService.login();
      return success;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    nostrService.signOut();
    eventBus.emit(EVENTS.USER_LOGGED_OUT);
  };

  return {
    isLoggedIn,
    isAuthInitialized,
    currentUserPubkey,
    login,
    logout
  };
}
