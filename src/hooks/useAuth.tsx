import { useState, useEffect } from 'react';
import { nostrService } from '@/lib/nostr';
import { eventBus, EVENTS } from '@/lib/services/EventBus';

/**
 * Reactive authentication hook that updates when auth state changes
 * This eliminates the need for page refresh after login/logout
 */
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!nostrService.publicKey);
  const [publicKey, setPublicKey] = useState<string | null>(nostrService.publicKey);

  useEffect(() => {
    console.log('[useAuth] Hook initialized, current state:', { 
      isLoggedIn: !!nostrService.publicKey, 
      publicKey: nostrService.publicKey 
    });

    // Listen for authentication state changes
    const handleAuthChange = (authData: { isLoggedIn: boolean; publicKey: string | null }) => {
      console.log('[useAuth] AUTH_CHANGED event received:', authData);
      setIsLoggedIn(authData.isLoggedIn);
      setPublicKey(authData.publicKey);
    };

    eventBus.on(EVENTS.AUTH_CHANGED, handleAuthChange);

    return () => {
      eventBus.off(EVENTS.AUTH_CHANGED, handleAuthChange);
    };
  }, []);

  // Check for state changes periodically (not on every render)
  useEffect(() => {
    const checkAuthState = () => {
      const currentLoggedIn = !!nostrService.publicKey;
      const currentPublicKey = nostrService.publicKey;
      
      if (currentLoggedIn !== isLoggedIn || currentPublicKey !== publicKey) {
        console.log('[useAuth] Detected state mismatch, updating:', {
          wasLoggedIn: isLoggedIn,
          nowLoggedIn: currentLoggedIn,
          wasPublicKey: publicKey,
          nowPublicKey: currentPublicKey
        });
        setIsLoggedIn(currentLoggedIn);
        setPublicKey(currentPublicKey);
      }
    };

    // Check immediately
    checkAuthState();
    
    // Then check periodically (reduced interval since we now have event emissions)
    const interval = setInterval(checkAuthState, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, publicKey]);

  return {
    isLoggedIn,
    publicKey,
    // Convenience getters for common use cases
    npub: publicKey ? nostrService.getNpubFromHex(publicKey) : null,
    shortPubkey: publicKey ? nostrService.formatPubkey(publicKey) : null
  };
} 

