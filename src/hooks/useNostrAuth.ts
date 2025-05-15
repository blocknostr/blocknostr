
import { useState, useEffect, useCallback } from 'react';
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
      
      console.log("[useNostrAuth] Auth state initialized:", { 
        isLoggedIn: !!pubkey, 
        pubkey: pubkey ? pubkey.substring(0, 8) + '...' : null 
      });
    };

    // Check initial login status
    checkLoginStatus();

    // Listen for login/logout events
    const handleLogin = (pubkey: string) => {
      console.log("[useNostrAuth] User logged in with pubkey:", pubkey.substring(0, 8) + '...');
      setIsLoggedIn(true);
      setCurrentUserPubkey(pubkey);
    };

    const handleLogout = () => {
      console.log("[useNostrAuth] User logged out");
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

  const login = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[useNostrAuth] Attempting login...");
      const success = await nostrService.login();
      
      if (success) {
        console.log("[useNostrAuth] Login successful");
        // The login event will be handled by the listener
      } else {
        console.warn("[useNostrAuth] Login failed");
      }
      
      return success;
    } catch (error) {
      console.error("[useNostrAuth] Login error:", error);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    console.log("[useNostrAuth] Logging out...");
    nostrService.signOut();
    eventBus.emit(EVENTS.USER_LOGGED_OUT);
  }, []);

  return {
    isLoggedIn,
    isAuthInitialized,
    currentUserPubkey,
    login,
    logout
  };
}
